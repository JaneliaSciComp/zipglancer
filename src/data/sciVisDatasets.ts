const BASE = 'https://ome-zarr-scivis.s3.us-east-1.amazonaws.com/v0.5/96x2-ozx';

export type SciVisDataset = {
  name: string;
  description: string;
  url: string;
};

const DATASETS: SciVisDataset[] = [
  { name: 'aneurism', description: 'Rotational C-arm x-ray scan of the arteries of the right half of a human head' },
  { name: 'backpack', description: 'CT scan of a backpack filled with items' },
  { name: 'beechnut', description: 'A microCT scan of a dried beechnut' },
  { name: 'blunt_fin', description: 'CFD simulation dataset' },
  { name: 'bonsai', description: 'CT scan of a bonsai tree' },
  { name: 'boston_teapot', description: 'CT scan of the SIGGRAPH 1989 teapot with a small version of the AVS lobster inside' },
  { name: 'bunny', description: 'CT scan of the Stanford Bunny with Hounsfield units denoting electron-density' },
  { name: 'carp', description: 'CT scan of a carp fish' },
  { name: 'chameleon', description: 'CT scan of a chameleon' },
  { name: 'christmas_tree', description: 'Scanned with a Siemens Somatom Plus 4 Volume Zoom Multislice-CT scanner at a Vienna hospital' },
  { name: 'csafe_heptane', description: 'Single time step from a computational simulation of a jet of heptane gas undergoing combustion' },
  { name: 'duct', description: 'A wall-bounded flow in a duct' },
  { name: 'engine', description: 'CT scan of two cylinders of an engine block' },
  { name: 'foot', description: 'Rotational C-arm x-ray scan of a human foot with tissue and bone present' },
  { name: 'frog', description: 'MRI scan of a frog as part of the Whole Frog Project' },
  { name: 'fuel', description: 'Simulation of fuel injection into a combustion chamber' },
  { name: 'hcci_oh', description: 'First timestep of direct numerical simulation of autoignition in stratified turbulent mixtures' },
  { name: 'hydrogen_atom', description: 'Simulation of the spatial probability distribution of the electron in a hydrogen atom' },
  { name: 'jicf_q', description: 'Q-criterion of a jet in crossflow from direct numerical simulation' },
  { name: 'kingsnake', description: 'Scan of a Lampropeltis getula egg for the Department of Geological Sciences at University of Texas' },
  { name: 'lobster', description: 'CT scan of a lobster contained in a block of resin' },
  { name: 'magnetic_reconnection', description: 'Single time step from a computational simulation of magnetic reconnection' },
  { name: 'marmoset_neurons', description: 'Pyramidal neurons in the marmoset primary visual cortex labeled with GFP' },
  { name: 'marschner_lobb', description: 'High frequencies where 99% of the sinusoids are right below the Nyquist frequency' },
  { name: 'miranda', description: 'Time step of a density field in a simulation of the mixing transition in Rayleigh-Taylor instability' },
  { name: 'mri_ventricles', description: '1.5T MRT 3D CISS dataset of a human head highlighting CSF-filled cavities' },
  { name: 'mri_woman', description: "MRI scan of a woman's head" },
  { name: 'mrt_angio', description: '3T MRT Time-of-Flight Angiography dataset of a human head' },
  { name: 'neghip', description: 'Simulation of the spatial probability distribution of electrons in a high potential protein molecule' },
  { name: 'neocortical_layer_1_axons', description: 'Axons in layer 1 of the mouse barrel cortex imaged in vivo' },
  { name: 'nucleon', description: 'Simulation of the two-body distribution probability of a nucleon in the atomic nucleus 16O' },
  { name: 'pancreas', description: 'First scan from abdominal contrast enhanced 3D CT from 82 subjects' },
  { name: 'pawpawsaurus', description: 'Holotype specimen from the Paw Paw Formation, scanned along the coronal axis for 1088 slices' },
  { name: 'pig_heart', description: 'Volumes obtained by computed tomography imaging on excised, postmortem porcine hearts' },
  { name: 'present', description: 'An industrial CT scan of a christmas present' },
  { name: 'prone', description: 'CT scan of abdomen in prone orientation' },
  { name: 'richtmyer_meshkov', description: 'Entropy field (timestep 160) of Richtmyer-Meshkov instability simulation' },
  { name: 'shockwave', description: 'Simulation of an unsteady interaction of a planar shockwave with a randomly-perturbed contact' },
  { name: 'silicium', description: 'Simulation of a silicium grid' },
  { name: 'skull', description: 'Rotational C-arm x-ray scan of phantom of a human skull' },
  { name: 'spathorhynchus', description: 'Holotype specimen from the Green River Formation, scanned for 750 slices' },
  { name: 'stag_beetle', description: 'Stag beetle scanned with an industrial CT by Johannes Kastner' },
  { name: 'statue_leg', description: 'CT scan of a leg of a bronze statue' },
  { name: 'stent', description: 'CT scan of the abdomen and pelvis containing a stent in the abdominal aorta' },
  { name: 'synthetic_truss_with_five_defects', description: 'Simulated CT scan of an 8x8x8 octet truss with five defects on the front side' },
  { name: 'tacc_turbulence', description: 'Time step from an isotropic turbulence simulation representing enstrophy on a Cartesian grid' },
  { name: 'tooth', description: 'Micro CT scan of a tooth' },
  { name: 'vertebra', description: 'Rotational angiography scan of a head with an aneurysm showing contrasted blood vessels' },
  { name: 'vis_male', description: 'CT scan of a male head' },
  { name: 'woodbranch', description: 'A microCT scan of dried wood branch (hazelnut)' },
  { name: 'zeiss', description: 'Car part reconstructed from projections' }
].map(d => ({ ...d, url: `${BASE}/${d.name}.ozx` }));

export default DATASETS;
