// BIO 40A Lab Exam — station data
// Each station has 1+ questions. Answers are set by the teacher in Teacher Mode
// and stored in localStorage; they are NOT hardcoded here.
// To edit text, change this file. To set answers, use Teacher Mode in the UI.

const STATIONS = [
    {
        id: 1,
        title: "Station 1 — Microscope",
        image: "images/station-01.jpg",
        caption: "Identify the tissue under the microscope.",
        questions: [
            {
                id: "q1",
                prompt: "What is this tissue?",
                options: [
                    "Compact Bone",
                    "Hyaline Cartilage",
                    "Nervous Tissue",
                    "Skeletal Muscle Tissue",
                    "Adipose Tissue",
                ],
            },
        ],
    },
    {
        id: 2,
        title: "Station 2 — Microscope",
        image: "images/station-02.jpg",
        caption: "Identify the tissue under the microscope.",
        questions: [
            {
                id: "q2",
                prompt: "What is this tissue?",
                options: [
                    "Cardiac Muscle Tissue",
                    "Stratified Squamous Epithelium",
                    "Pseudostratified Ciliated Columnar Epithelium",
                    "Blood",
                    "Areolar Connective Tissue",
                ],
            },
        ],
    },
    {
        id: 3,
        title: "Station 3 — Cell Model",
        image: "images/station-03.jpg",
        caption: "Two organelles are pinned on the cell model.",
        questions: [
            {
                id: "q3",
                prompt: "Question 3: What is this organelle?",
                options: [
                    "Mitochondria",
                    "Golgi Apparatus",
                    "Cytoplasm",
                    "Ribosome",
                ],
            },
            {
                id: "q4",
                prompt: "Question 4: What is this organelle?",
                options: [
                    "Rough endoplasmic reticulum",
                    "Smooth endoplasmic reticulum",
                    "Centrioles",
                    "Centromere",
                ],
            },
        ],
    },
    {
        id: 4,
        title: "Station 4 — Skull",
        image: "images/station-04.jpg",
        caption: "Pins on the skull mark a suture and a structure.",
        questions: [
            {
                id: "q5",
                prompt: "Question 5: What is this cranial suture?",
                options: [
                    "Coronal Suture",
                    "Lambdoid Suture",
                    "Squamous Suture",
                    "Sagittal Suture",
                ],
            },
            {
                id: "q6",
                prompt: "Question 6: What is this structure?",
                options: [
                    "Infraorbital foramen",
                    "Supraorbital foramen/notch",
                    "Zygomatic process",
                    "Mastoid process",
                    "Styloid process",
                ],
            },
        ],
    },
    {
        id: 5,
        title: "Station 5 — Vertebrae",
        image: "images/station-05.jpg",
        caption: "Identify the vertebra type and the pinned structure.",
        questions: [
            {
                id: "q7",
                prompt: "Question 7: What kind of vertebrae is this?",
                options: [
                    "Atlas (C1)",
                    "Axis (C2)",
                    "Cervical (C3-7)",
                    "Thoracic Vertebra",
                    "Lumbar Vertebra",
                ],
            },
            {
                id: "q8",
                prompt: "Question 8: What is this structure?",
                options: [
                    "Dens",
                    "Spinous Process",
                    "Transverse Process",
                    "Lamina",
                    "Pedicle",
                ],
            },
        ],
    },
    {
        id: 6,
        title: "Station 6 — Skin Model",
        image: "images/station-06.jpg",
        caption: "Skin model with pinned structure + dermis layer.",
        // NOTE: Q9 options were partially blurry in the source photo.
        // Verify the exact answer choices and edit this list if needed.
        questions: [
            {
                id: "q9",
                prompt: "Question 9: What is this structure?",
                options: [
                    "Sudoriferous gland",
                    "Sebaceous gland",
                    "Arrector pili",
                    "Pacinian corpuscle",
                    "Meissner corpuscle",
                ],
            },
            {
                id: "q10",
                prompt: "Question 10: What is this layer?",
                options: [
                    "Reticular",
                    "Papillary",
                ],
            },
        ],
    },
    {
        id: 7,
        title: "Station 7 — Skull Bones",
        image: "images/station-07.jpg",
        caption: "A cranial bone (yellow) and a mandible.",
        questions: [
            {
                id: "q11",
                prompt: "Question 11: What is this bone?",
                options: [
                    "Ethmoid",
                    "Sphenoid",
                    "Temporal",
                    "Parietal",
                    "Occipital",
                ],
            },
            {
                id: "q12",
                prompt: "Question 12: What structure is this?",
                options: [
                    "Mental protuberance",
                    "Mental foramen",
                    "Alveolar process",
                    "Mandibular condyle",
                ],
            },
        ],
    },
    {
        id: 8,
        title: "Station 8 — Long Bone",
        image: "images/station-08.jpg",
        caption: "Identify the bone and the pinned structure.",
        questions: [
            {
                id: "q13",
                prompt: "Question 13: What bone is this?",
                options: [
                    "Humerus",
                    "Radius",
                    "Ulna",
                    "Tibia",
                    "Fibula",
                ],
            },
            {
                id: "q14",
                prompt: "Question 14: What structure is this?",
                options: [
                    "Capitulum",
                    "Trochlea",
                    "Olecranon fossa",
                    "Greater tubercle",
                    "Lesser tubercle",
                ],
            },
        ],
    },
    {
        id: 9,
        title: "Station 9 — Pelvis",
        image: "images/station-09.jpg",
        caption: "Two pinned structures on the pelvis.",
        questions: [
            {
                id: "q15",
                prompt: "Question 15: What structure is this?",
                options: [
                    "Pubic symphysis",
                    "Iliac crest",
                    "Greater sciatic notch",
                    "Obturator foramen",
                ],
            },
            {
                id: "q16",
                prompt: "Question 16: What structure is this?",
                options: [
                    "Sacral hiatus",
                    "Sacral foramina",
                    "Median sacral crest",
                ],
            },
        ],
    },
    {
        id: 10,
        title: "Station 10 — Femur",
        image: "images/station-10.jpg",
        caption: "Two pinned structures on the femur.",
        questions: [
            {
                id: "q17",
                prompt: "Question 17: What is this structure?",
                options: [
                    "Greater trochanter",
                    "Lesser trochanter",
                    "Intercondylar fossa",
                    "Linea aspera",
                    "Lateral epicondyle",
                ],
            },
            {
                id: "q18",
                prompt: "Question 18: What structure is this?",
                options: [
                    "Tibial tuberosity",
                    "Medial malleolus",
                    "Lateral condyle",
                    "Medial condyle",
                    "Anterior crest/border",
                ],
            },
        ],
    },
    {
        id: 11,
        title: "Station 11 — Hand & Foot",
        image: "images/station-11.jpg",
        caption: "Identify the pinned hand bone and foot bone.",
        questions: [
            {
                id: "q19",
                prompt: "Question 19: What is this bone?",
                options: [
                    "Lunate",
                    "Capitate",
                    "Scaphoid",
                    "Trapezium",
                    "Trapezoid",
                ],
            },
            {
                id: "q20",
                prompt: "Question 20: What is this bone?",
                options: [
                    "Navicular",
                    "Calcaneus",
                    "Talus",
                    "Medial cuneiform",
                    "Lateral cuneiform",
                ],
            },
        ],
    },
    {
        id: 12,
        title: "Station 12 — Right or Left?",
        image: "images/station-12.jpg",
        caption: "Three bones. For each, identify whether it is a right or a left.",
        questions: [
            {
                id: "q21",
                prompt: "Question 21: Is this bone a right or a left?",
                options: ["Right", "Left"],
            },
            {
                id: "q22",
                prompt: "Question 22: Is this bone a right or a left?",
                options: ["Right", "Left"],
            },
            {
                id: "q23",
                prompt: "Question 23: Is this bone a right or a left?",
                options: ["Right", "Left"],
            },
        ],
    },
];
