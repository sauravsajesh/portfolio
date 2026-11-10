/*
  The portfolio's content, in one place. Everything on the page that lists work, skills or history is
  rendered from this file by js/app.js, so a change here is a change on the site.

  Source: SauravSajesh_CV.pdf and Saurav_Sajesh_Portfolio.pdf. Nothing here is invented: every figure,
  date, name and link is one of theirs.

  MEDIA SLOTS (Higgsfield or Fable renders). Each project has a `media` entry:
      poster  a still that always shows (required)
      video   a short muted loop, e.g. "media/thesis.mp4" (optional). Add the file to site/media and put
              its path here; the frame then plays it while its project is open, with a pause button,
              and keeps the poster on phones and under reduced motion.
      alt     what the picture shows, for screen readers
*/

export const profile = {
  name: 'Saurav Sajesh',
  role: 'Embedded AI engineer',
  place: 'Ilmenau, Germany',
  email: 'saurav.sajesh2001@gmail.com',
  linkedin: 'https://linkedin.com/in/sauravsajesh',
  github: 'https://github.com/sauravsajesh/energy-forecasting-mlops',
};

/* The four competencies the explorer filters by and the skills section is sorted into. */
export const areas = [
  { id: 'embedded-ai', label: 'Embedded AI' },
  { id: 'ml-pipelines', label: 'ML pipelines' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'software', label: 'Software engineering' },
];

export const projects = [
  {
    id: 'thesis',
    kind: 'Master’s thesis',
    short: 'Degradation trends on a Cortex-M4',
    title: 'Unsupervised degradation trend estimation for machinery parts in industrial scenarios for energy-constrained applications',
    meta: 'Deggendorf Institute of Technology · researched at IMMS, Ilmenau · supervisor Rick Pandey',
    areas: ['embedded-ai', 'firmware'],
    summary: 'An unsupervised framework that estimates how far a bearing has degraded, built to run on an energy-constrained microcontroller. Most prognostics models need labelled run-to-failure data and more memory than a Cortex-M4 has; this one needs neither.',
    stages: [
      { title: 'Spectral disentanglement', text: 'FFT and Welch’s method move the vibration signal into the frequency domain and separate local defect kinematics from broadband operating noise.' },
      { title: 'Health indicator, ASH-HI', text: 'The Anti-Self-Healing Health Indicator cancels the self-healing effect seen in bearings, so the degradation vector only rises.' },
      { title: 'Trend stabilisation', text: 'First Predicting Time is detected from baseline statistical thresholds; Linear Rectification then makes the trend piecewise monotonic.' },
      { title: 'Edge-native memory', text: 'The active memory footprint is decoupled from the input batch size, which keeps it inside the SRAM of an STM32 Cortex-M.' },
    ],
    stack: [
      { name: 'TinyML' }, { name: 'Unsupervised learning' }, { name: 'FFT' }, { name: 'Welch’s method' },
      { name: 'ARM Cortex-M4' }, { name: 'STM32' }, { name: 'PRONOSTIA' }, { name: 'NASA IMS' },
    ],
    figures: [
      { value: '0.9896', label: 'Trendability (Pearson), best case' },
      { value: '> 0.91', label: 'Robustness metric' },
    ],
    links: [],
    media: { poster: 'media/thesis.webp', video: '', alt: 'Vibration spectra stacked over time, one ridge rising as a bearing wears' },
  },
  {
    id: 'aersut',
    kind: 'Paper',
    short: 'Emotion recognition from speech',
    title: 'Automatic Emotion Recognition System using tinyML (AERSUT)',
    meta: '2022 International Conference on Futuristic Technologies (INCOFT), IEEE',
    areas: ['embedded-ai'],
    summary: 'An emotion detector that classifies 8 emotional states from raw speech on a microcontroller. Two networks were trained, quantized and deployed to a TinyML development board, where they run in real time from the onboard microphone.',
    stages: [
      { title: 'Data pipeline', text: 'About 20,000 audio files from RAVDESS and CREMA-D, augmented in Librosa by time stretching, pitch shifting and noise injection.' },
      { title: 'Feature extraction', text: 'Mel frequency cepstral coefficients, Mel spectrograms, zero-crossing rate and RMS energy.' },
      { title: 'Model architecture', text: 'A convolutional network compared against a hybrid CNN-LSTM built for temporal sequence prediction.' },
      { title: 'Hardware deployment', text: 'Both models are quantized and converted with TensorFlow Lite, then run on the board itself.' },
    ],
    stack: [
      { name: 'TensorFlow Lite', icon: 'tensorflow' }, { name: 'CNN' }, { name: 'CNN-LSTM' }, { name: 'Librosa' },
      { name: 'MFCC' }, { name: 'Mel spectrograms' }, { name: 'RAVDESS' }, { name: 'CREMA-D' },
    ],
    figures: [
      { value: '99%', label: 'CNN training accuracy' },
      { value: '96%', label: 'CNN-LSTM training accuracy' },
    ],
    links: [{ label: 'Read the paper on IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/10094330' }],
    media: { poster: 'media/aersut.webp', video: '', alt: 'A Mel spectrogram of speech, bright bands where the voice carries energy' },
  },
  {
    id: 'rescue',
    kind: 'Paper',
    short: 'Quadruped rescue robot with SLAM',
    title: 'Rescue Robot using Backtracking Algorithm and SLAM Algorithm',
    meta: 'International Journal of Research in Engineering, Science and Management (IJRESM)',
    areas: ['firmware'],
    summary: 'A four-legged robot architecture that searches a disaster site on its own. It plans its path, maps the site with LiDAR and sends what it finds to a command centre over long-range radio.',
    stages: [
      { title: 'Path planning', text: 'A backtracking search explores obstacle-ridden ground without repeating a route, which widens the area covered.' },
      { title: 'Mapping and localisation', text: 'LiDAR-based SLAM builds a 3D point-cloud map of an unknown site while it tracks the robot’s own position.' },
      { title: 'Dual-controller hardware', text: 'A Raspberry Pi runs SLAM and LiDAR processing; an STM32 Nucleo-64 drives the 12 servo motors of the legs.' },
      { title: 'Remote telemetry', text: 'LoRa transceivers let several robots send map data and GPS coordinates to a command centre at low power.' },
    ],
    stack: [
      { name: 'Raspberry Pi', icon: 'raspberry-pi' }, { name: 'STM32 Nucleo-64' }, { name: 'LiDAR' }, { name: 'SLAM' },
      { name: 'Backtracking search' }, { name: 'LoRa' },
    ],
    figures: [{ value: '12', label: 'Servo motors driven by the STM32' }],
    links: [{ label: 'Read the article in IJRESM', href: 'https://journal.ijresm.com/index.php/ijresm/article/view/2656' }],
    media: { poster: 'media/rescue.webp', video: '', alt: 'A LiDAR point cloud of a room, with the path a robot has searched' },
  },
  {
    id: 'energy',
    kind: 'Project',
    short: 'Energy load forecasting on Azure',
    title: 'Industrial Energy Forecasting: Edge-Cloud MLOps Pipeline',
    meta: 'End-to-end MLOps pipeline on real German grid data (OPSD 2015–2023)',
    areas: ['ml-pipelines', 'software'],
    summary: 'A fully containerized pipeline that forecasts industrial energy load 24 hours ahead from German grid data. An LSTM is trained, served through a Flask API and redeployed to Azure on every commit.',
    stages: [
      { title: 'Data engineering', text: 'About 70,000 hourly samples from the German power grid, normalized, with 24 h and 168 h rolling averages and sequences built to prevent leakage.' },
      { title: 'LSTM model', text: '64 units and 0.2 dropout in TensorFlow 2.16.2, reading 24-hour windows of 7 features.' },
      { title: 'Cloud deployment', text: 'A Flask inference API in Docker on Azure Container Instances; the weights are fetched from Azure Blob Storage.' },
      { title: 'CI/CD', text: 'GitHub Actions builds and pushes each image to Azure Container Registry and runs pytest against the endpoint.' },
    ],
    stack: [
      { name: 'Python', icon: 'python' }, { name: 'TensorFlow', icon: 'tensorflow' }, { name: 'Keras', icon: 'keras' },
      { name: 'Docker', icon: 'docker' }, { name: 'Azure', icon: 'azure' }, { name: 'GitHub Actions', icon: 'github-actions' },
      { name: 'Flask', icon: 'flask' }, { name: 'pytest', icon: 'pytest' },
    ],
    figures: [
      { value: '3.35%', label: 'MAPE, an 80% improvement' },
      { value: '1,722 MW', label: 'Mean absolute error' },
    ],
    links: [{ label: 'See the code on GitHub', href: 'https://github.com/sauravsajesh/energy-forecasting-mlops' }],
    media: { poster: 'media/energy.webp', video: '', alt: 'A week of hourly grid load drawn as seven stacked daily curves' },
  },
  {
    id: 'amr',
    kind: 'Project',
    short: 'Autonomous mobile robot in ROS',
    title: 'Autonomous Mobile Robot with Obstacle Tracking',
    meta: 'ROS Noetic simulation and navigation',
    areas: ['firmware'],
    summary: 'A differential-drive robot, designed and simulated in ROS Noetic. It maps its surroundings, plans round obstacles and stops itself when the camera sees movement or the IMU reads a slope too steep.',
    stages: [
      { title: 'Mechanical design', text: 'The chassis is modelled in Autodesk Fusion 360 and exported to URDF so ROS can use it.' },
      { title: 'Navigation stack', text: 'AMCL for localisation, costmaps for dynamic path planning and GMapping for 2D occupancy grids from Velodyne LiDAR data.' },
      { title: 'Computer vision', text: 'Python nodes run OpenCV frame differencing and contour detection, and trigger an emergency stop when an object moves.' },
      { title: 'IMU safety control', text: 'A monitor node computes terrain pitch from quaternions and halts the robot before it can tip.' },
    ],
    stack: [
      { name: 'ROS Noetic' }, { name: 'Gazebo' }, { name: 'Rviz' }, { name: 'GMapping' }, { name: 'AMCL' },
      { name: 'OpenCV', icon: 'opencv' }, { name: 'Python', icon: 'python' }, { name: 'Fusion 360' },
    ],
    figures: [],
    links: [],
    media: { poster: 'media/amr.webp', video: '', alt: 'An occupancy grid map with walls, free space and a planned route through it' },
  },
  {
    id: 'coral',
    kind: 'Project',
    short: 'Image to line drawing on Google Coral',
    title: 'Embedded Platform for Image to Line Drawing using Google Coral',
    meta: 'Hardware-accelerated computer vision and actuation',
    areas: ['embedded-ai', 'firmware', 'software'],
    summary: 'An embedded system that takes an uploaded image, extracts its line art and draws it on paper with an AxiDraw pen plotter. All of it runs on one Google Coral Dev Board under Embedded Linux.',
    stages: [
      { title: 'Image processing', text: 'OpenCV converts to grayscale, then applies Gaussian blur, Canny edge detection and morphological dilation to get continuous line art.' },
      { title: 'Hardware acceleration', text: 'A quantized SSD MobileNet V2 on the Edge TPU detects the objects in the image at low latency.' },
      { title: 'Web interface', text: 'A Flask server takes the upload and turns the detected raster edges into SVG paths with svgwrite.' },
      { title: 'Physical actuation', text: 'The board drives the AxiDraw through pyaxidraw, which turns the SVG into pen commands.' },
    ],
    stack: [
      { name: 'Google Coral Dev Board' }, { name: 'Edge TPU' }, { name: 'SSD MobileNet V2' },
      { name: 'OpenCV', icon: 'opencv' }, { name: 'Flask', icon: 'flask' }, { name: 'svgwrite' }, { name: 'AxiDraw' },
      { name: 'Embedded Linux', icon: 'linux-tux' },
    ],
    figures: [],
    links: [],
    media: { poster: 'media/coral.webp', video: '', alt: 'Pen-plotter line art: the outlines of a still life drawn in single strokes' },
  },
  {
    id: 'translator',
    kind: 'Project',
    short: 'German to English Transformer',
    title: 'Language Translator (Deutsch to English)',
    meta: 'Custom Seq2Seq Transformer model',
    areas: ['ml-pipelines', 'software'],
    summary: 'A sequence-to-sequence Transformer written from scratch and trained to translate German into English. A small web app sets its output beside a pre-trained model’s, sentence by sentence.',
    stages: [
      { title: 'Data engineering', text: 'The Multi30k dataset, about 29,000 sentences, tokenized with SpaCy; Torchtext builds the vocabulary and collates the batches.' },
      { title: 'Model architecture', text: 'A full Transformer with positional encoding, multi-head self-attention and masked attention for autoregressive decoding.' },
      { title: 'Training and evaluation', text: '18 epochs on Google Colab with cross-entropy loss, scored with the BLEU metric.' },
      { title: 'Web application', text: 'A Flask app runs the inference pipeline and shows Hugging Face’s MarianMT translation next to it.' },
    ],
    stack: [
      { name: 'PyTorch', icon: 'pytorch' }, { name: 'Torchtext' }, { name: 'SpaCy' }, { name: 'Transformers' },
      { name: 'Flask', icon: 'flask' }, { name: 'Hugging Face MarianMT', icon: 'hugging-face' }, { name: 'Google Colab' },
    ],
    figures: [
      { value: '0.2765', label: 'BLEU score' },
      { value: '18', label: 'Training epochs' },
    ],
    links: [],
    media: { poster: 'media/translator.webp', video: '', alt: 'An attention map between German and English tokens, brightest along the diagonal' },
  },
];

/* Skills, each with the projects or roles it was used in (ids from `projects`, or a plain label). */
export const skills = [
  {
    area: 'embedded-ai',
    lead: 'Models that run on the device: quantized networks on a TinyML board, SSD MobileNet V2 on an Edge TPU, a health indicator on a Cortex-M4. Each was sized against the memory it had.',
    link: { label: 'See the thesis', project: 'thesis' },
    items: [
      { name: 'TinyML', glyph: 'microchip', used: ['thesis', 'aersut'] },
      { name: 'TensorFlow Lite', icon: 'tensorflow', used: ['aersut'] },
      { name: 'Model quantization', glyph: 'binary', used: ['aersut', 'coral'] },
      { name: 'Edge TPU', glyph: 'cpu', used: ['coral'] },
      { name: 'ARM Cortex-M4', glyph: 'circuit-board', used: ['thesis'] },
      { name: 'Signal processing', glyph: 'activity', used: ['thesis', 'aersut'] },
    ],
  },
  {
    area: 'ml-pipelines',
    lead: 'From raw data to a served model: about 70,000 hourly grid samples into an LSTM, packed in Docker and deployed on Azure by GitHub Actions. PyTorch for the Transformer, TensorFlow for the rest.',
    link: { label: 'See the energy pipeline', project: 'energy' },
    items: [
      { name: 'TensorFlow and Keras', icon: 'tensorflow', used: ['energy'] },
      { name: 'PyTorch', icon: 'pytorch', used: ['translator'] },
      { name: 'Time-series models', glyph: 'chart-line', used: ['energy', 'thesis'] },
      { name: 'Docker', icon: 'docker', used: ['energy'] },
      { name: 'Azure', icon: 'azure', used: ['energy'] },
      { name: 'GitHub Actions', icon: 'github-actions', used: ['energy'] },
    ],
  },
  {
    area: 'firmware',
    lead: 'Work close to the hardware: an STM32 Nucleo-64 driving 12 servo motors, Python and C acquisition scripts at IMMS, and LiDAR, camera and IMU fused under ROS Noetic.',
    link: { label: 'See the rescue robot', project: 'rescue' },
    items: [
      { name: 'C and C++', icon: 'c-plusplus', used: ['IMMS'] },
      { name: 'STM32', glyph: 'microchip', used: ['rescue', 'thesis'] },
      { name: 'Raspberry Pi', icon: 'raspberry-pi', used: ['rescue', 'amr'] },
      { name: 'ROS Noetic', glyph: 'waypoints', used: ['amr'] },
      { name: 'Sensor fusion', glyph: 'radar', used: ['amr', 'rescue'] },
      { name: 'Embedded Linux', icon: 'linux-tux', used: ['coral'] },
    ],
  },
  {
    area: 'software',
    lead: 'The code around the model: Flask services for inference, pytest in the CI run and OpenCV pipelines in Python, with Git, Bash and Linux underneath.',
    link: { label: 'See the translator', project: 'translator' },
    items: [
      { name: 'Python', icon: 'python', used: ['energy', 'coral', 'amr', 'IMMS'] },
      { name: 'Flask', icon: 'flask', used: ['energy', 'coral', 'translator'] },
      { name: 'OpenCV', icon: 'opencv', used: ['coral', 'amr'] },
      { name: 'pytest', icon: 'pytest', used: ['energy'] },
      { name: 'Git', icon: 'git', used: ['energy'] },
      { name: 'Bash', icon: 'bash', used: [] },
    ],
  },
];

export const history = [
  {
    role: 'Master thesis researcher',
    org: 'IMMS, Ilmenau',
    dates: '11/2025 – 06/2026',
    text: 'Built ASH-HI, a health indicator for bearings that runs on a Cortex-M4, and tested it on the PRONOSTIA and NASA IMS benchmarks.',
  },
  {
    role: 'HiWi student researcher',
    org: 'IMMS, Ilmenau',
    dates: '07/2025 – 09/2025',
    text: 'Wrote Python and C scripts for real-time sensor acquisition, and analysed AI workloads on constrained test hardware.',
  },
  {
    role: 'M.Eng. AI for Smart Sensors and Actuators',
    org: 'Deggendorf Institute of Technology',
    dates: '10/2023 – 07/2026',
    text: 'Final grade 2.5, thesis 1.9. Applied machine learning, intelligent systems and embedded control.',
  },
  {
    role: 'B.Tech. Electronics and Communication Engineering',
    org: 'Model Engineering College, Kochi',
    dates: '06/2019 – 07/2023',
    text: 'German-equivalent grade 2.33. Machine learning, signal processing, microcontrollers and computer architecture.',
  },
];

export const certificates = [
  { name: 'Embedded Architecture', by: 'CU Boulder', href: 'https://coursera.org/verify/BYVV2EXOWV9H' },
  { name: 'ML in Production', by: 'DeepLearning.AI', href: 'https://coursera.org/share/ce98cf0fdda790de8baa3b7361c95864' },
];

export const languages = [
  { name: 'English', level: 'Full professional, IELTS 7.5' },
  { name: 'German', level: 'A2, working towards B1' },
  { name: 'Hindi and Malayalam', level: 'Native' },
];
