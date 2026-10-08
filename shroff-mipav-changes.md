# Major changes to MIPAV and ShroffCelegansModels.jl

Author: Mark Kittisopikul (Janelia Research Campus, Scientific Computing)
Repositories:
- https://github.com/JaneliaSciComp/mipav (Janelia fork, worm untwisting plugin)
- https://github.com/JaneliaSciComp/ShroffCelegansModels.jl (analysis, averaging, web service)

> Draft compiled from git history and source. Items marked **[confirm]** come from the author's description and were not independently checked in code or are stated more strongly than the code alone shows.

## 1. Design principles

Two principles run through both repositories.

### 1.1 Straightening is continuous, not discretized in space

Many straightening approaches resample the worm onto a voxel grid in a canonical frame. Here the worm is never resampled. The body is a parametric model, and the straightened body is another parametric model derived from it.

- The central axis is a natural cubic spline through the midpoints of the left and right seam cell pairs, parameterized by normalized arc length.
- The outer contour is **32 natural cubic splines** running anterior to posterior, one per point on the cross-section contour. Each spline is 3D in the twisted model (`CelegansModel`). **[confirm: 32 is the default contour point count; the README says "typically 16 or 32" and the code takes the count from the cross-section data]**
- `StraightenedCelegansModel` replaces the central spline with a straight spline along Z whose Z coordinate is the arc length of the original axis. Its transverse splines are evaluated on demand through the original model (`StraightenedTransverseSpline`).
- Annotations are mapped by projecting each 3D point onto the central spline and expressing it relative to that axis and the contour. The result is a continuous coordinate, not a voxel index.
- Averaging across animals works on the splines themselves. Contour positions are sampled at shared knots, averaged (optionally weighted), and refit as natural cubic splines.

Consequences:
- No resampling blur and no grid-size choice.
- The model can be evaluated at any position along the body.
- Arc length and derivatives come from the spline, not finite differences.

Limitation: arc length of the central axis is computed numerically with a trapezoidal sum over a fine sampling of the spline derivative. That sampling is of the parameter, not of space, but it is an approximation.

### 1.2 No interpolation over outliers

Timepoints flagged as outliers in a dataset's `cell_key` are not repaired by interpolating from their neighbors.

- Outlier timepoints have no lattice or annotation files on disk. The loaders treat a missing file as acceptable only if the timepoint is listed in `cell_key.outliers`; otherwise they raise an error.
- For outlier timepoints the loaders return `missing`, and straightened annotations and lattice axes are `NaN`.
- Averaging and smoothing skip missing values rather than filling them. A cell is `NaN` only if every timepoint is missing or an outlier.
- Outlier timepoints can be identified from the web interface via URL, and a z-score analysis lists candidate outliers for review.

Consequences:
- Reported positions reflect measured data only.
- Gaps stay visible in plots and movies.
- Downstream users decide whether and how to fill them.

**[confirm: this section is inferred from the loader and NaN/missing handling. Check that temporal smoothing does not bridge across `NaN` gaps before stating it as a guarantee.]**

## 2. MIPAV (Janelia fork)

Commits Nov 2022 to Feb 2024. The worm untwisting work lives mostly in `WormUntwisting/LatticeModel.java`.

| Date | Change |
|------|--------|
| Nov 2022 | Moved `trunk/mipav` to the repository top level during migration; fixed `ViewTableModel` cast and build error; added Eclipse support (zulu-11, Java 1.8 target); added `MarkernoteDescriptor`/`MarkernoteDirectory` |
| Nov 2022 | Shroff Lab demo code (tag `shroff_demo_2022_11_17`) |
| Dec 2022 | Added a Janelia tag to the version; replaced hard-coded `"mipav"` with `Preferences.getPreferencesDir()`; new `PlugInWormUntwistingDualPanelJanelia` plugin |
| Jan 2023 | `AlgorithmFFT` now supports 1D FFTs; **Fourier interpolation of cross sections** using it; options for number of cross-section samples, dragging, numpad shortcuts |
| Mar 2023 | Cross sections persist to disk and reload; fixes for disappearing LUT/opacity panels and a null center line crash |
| Apr 2023 | **First working untwisting implementation**; minimum original radius; precomputed sinc function; keyboard selection of cross sections; fixes for channel selection, divider scaling, batch untwist, NPE when moving a point, and load-before-save |
| May to Jun 2023 | Preview disabled during cross-section editing; lattice UI reset; shrinkage and missing markers allowed |

The cross-section CSVs written here (`model_crossSections/latticeCrossSection_N.csv`) are the contour input that ShroffCelegansModels.jl reads.

## 3. ShroffCelegansModels.jl

270 of 281 commits (Nov 2023 to Sep 2026). The rest are CompatHelper.

### 3.1 Model core
- Model types: `CelegansModel`, `CachedCelegansModel`, `StraightenedCelegansModel`, `RadialCelegansModel`, all behind `AbstractCelegansModel`.
- `build_celegans_model` builds a model from `lattice.csv` plus the MIPAV cross sections.
- Makie `mesh!` recipe for any model type.
- `average` for weighted averaging of straightened models.

### 3.2 Annotation mapping and averaging
- `nearest_central_pt` and `untwist_annotations` project annotations into the straightened frame.
- Annotations are averaged across animals over normalized developmental time.
- Seam cells are injected into the averaged annotations before smoothing (Jun 2026).
- Thin plate spline warping through a pinned ThinPlateSplines.jl branch, which fixed all-NaN annotations (Jun 2026).

### 3.3 Smoothing (2026)
- Unsmoothed HDF5, CSV and movie outputs are written beside the smoothed track.
- Opt-in endpoint anchoring in temporal smoothing, with Edge Pad and Taper Width sliders and a Smooth Seam Cells toggle in `show_average_annotations`.
- Smoothing-parameter variants are emitted alongside the production track.

### 3.4 Quality control
- Lattice left/right and dorsal-ventral orientation check, generalized to 31 cells (Jul 2026), with a web page and a scheduled job.
- Flipped LR/DV axes.
- Left/right flip detection script, z-score analysis, and AP axis debug and fix apps.

### 3.5 Web service and pipeline
- Bonito web apps for averaged meshes, annotations, orientation, AP axis fixes, z-scores and modified times.
- `recompute_pipeline.jl` and scheduled recompute on OpenShift.
- Static meshscatter HTML exports (hover highlight, play/pause at 48 fps) built into the pipeline (Sep 2026).
- Precompile cache for faster cold starts, annotation cache keyed on modification time, parallel priming of the flat step.
- Containerized deployment for production and test, a post-deploy endpoint check that also inspects response bodies, and runbooks for LSF and Apptainer.

## 4. Suggested framing for the write-up

1. Lead with the two design principles. They set this work apart from grid-based straightening and from pipelines that fill gaps.
2. Present MIPAV as the front end that produces the contour cross sections, and ShroffCelegansModels.jl as the continuous model, averaging and delivery layer.
3. Close with the production pipeline, since it is what made the results routinely reproducible.
