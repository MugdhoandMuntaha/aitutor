/**
 * Harvard University SEAS Computer Science Curriculum
 * Bachelor of Science in Computer Science & Engineering (B.Sc. CSE)
 * 4-Year / 8-Semester Comprehensive Course Catalog & Degree Audit
 */

export const HARVARD_CSE_CURRICULUM = [
  // --- YEAR 1: FRESHMAN YEAR ---
  {
    semester: 1,
    termName: "Freshman Fall (Semester 1)",
    courses: [
      {
        code: "CS 50",
        title: "Introduction to Computer Science",
        department: "Computer Science",
        credits: 4.0,
        category: "Core Software",
        prerequisites: "None",
        description: "An introduction to the intellectual enterprises of computer science and the art of programming. Covers C, Python, SQL, HTML/CSS, JavaScript, algorithms, data structures, resource management, and security."
      },
      {
        code: "MATH 21A",
        title: "Multivariable Calculus",
        department: "Mathematics",
        credits: 4.0,
        category: "Mathematics",
        prerequisites: "Single-variable Calculus (BC Calculus)",
        description: "Vectors, geometry of space, vector-valued functions, partial derivatives, multiple integrals, Green's, Stokes', and Divergence theorems."
      },
      {
        code: "PHY 15A",
        title: "Introductory Mechanics and Relativity",
        department: "Physics",
        credits: 4.0,
        category: "Basic Science",
        prerequisites: "Concurrent Calculus",
        description: "Newtonian mechanics, conservation laws, oscillatory motion, gravitation, special relativity, and Lorentz transformations."
      },
      {
        code: "EXPOS 20",
        title: "Expository Writing & Technical Communication",
        department: "Writing Program",
        credits: 4.0,
        category: "General Education",
        prerequisites: "None",
        description: "Development of critical thinking and analytical writing, research synthesis, and technical communication in engineering disciplines."
      }
    ]
  },
  {
    semester: 2,
    termName: "Freshman Spring (Semester 2)",
    courses: [
      {
        code: "CS 51",
        title: "Abstraction and Design in Computation",
        department: "Computer Science",
        credits: 4.0,
        category: "Core Software",
        prerequisites: "CS 50",
        description: "Introduction to software engineering paradigms with focus on functional programming (OCaml), type systems, object-oriented design, modules, and abstract data types."
      },
      {
        code: "MATH 21B",
        title: "Linear Algebra and Differential Equations",
        department: "Mathematics",
        credits: 4.0,
        category: "Mathematics",
        prerequisites: "MATH 21A",
        description: "Linear spaces, linear transformations, matrices, determinants, eigenvalues and eigenvectors, systems of linear differential equations."
      },
      {
        code: "CS 20",
        title: "Discrete Mathematics for Computer Science",
        department: "Computer Science",
        credits: 4.0,
        category: "Theoretical CS",
        prerequisites: "MATH 21A",
        description: "Mathematical induction, propositional and predicate logic, set theory, relations, combinatorics, graph theory, and proof techniques essential for computing."
      },
      {
        code: "GENED 1080",
        title: "Engineering the Future: Technology and Society",
        department: "General Education",
        credits: 4.0,
        category: "General Education",
        prerequisites: "None",
        description: "Explores the ethical, societal, and economic implications of computing innovations and artificial intelligence."
      }
    ]
  },

  // --- YEAR 2: SOPHOMORE YEAR ---
  {
    semester: 3,
    termName: "Sophomore Fall (Semester 3)",
    courses: [
      {
        code: "CS 61",
        title: "Systems Programming and Machine Organization",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 50 or CS 51",
        description: "Hardware-software interface, x86-64 assembly, processor architecture, cache hierarchies, virtual memory, concurrency, profiling, and C systems programming."
      },
      {
        code: "STAT 110",
        title: "Introduction to Probability",
        department: "Statistics",
        credits: 4.0,
        category: "Mathematics",
        prerequisites: "MATH 21A & MATH 21B",
        description: "Conditioning, Bayes' rule, random variables, joint distributions, expectations, Markov chains, law of large numbers, and central limit theorem."
      },
      {
        code: "CS 120",
        title: "Intro to Algorithms & Their Limitations",
        department: "Computer Science",
        credits: 4.0,
        category: "Theoretical CS",
        prerequisites: "CS 20 & CS 50",
        description: "Algorithm design paradigms (divide-and-conquer, greedy, dynamic programming), asymptotic analysis, tractability, and computational complexity."
      },
      {
        code: "EE 50",
        title: "Digital Logic Design and Computer Hardware",
        department: "Electrical Engineering",
        credits: 4.0,
        category: "Computer Engineering",
        prerequisites: "PHY 15A",
        description: "Boolean algebra, combinational and sequential logic, finite state machines, FPGA design, ALU implementation, and register-transfer logic."
      }
    ]
  },
  {
    semester: 4,
    termName: "Sophomore Spring (Semester 4)",
    courses: [
      {
        code: "CS 124",
        title: "Data Structures and Advanced Algorithms",
        department: "Computer Science",
        credits: 4.0,
        category: "Theoretical CS",
        prerequisites: "CS 120",
        description: "Advanced graph algorithms, network flow, randomized algorithms, self-balancing search structures, amortized analysis, and NP-completeness."
      },
      {
        code: "CS 161",
        title: "Operating Systems",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 61",
        description: "Kernel architecture, process synchronization, preemptive scheduling, virtual memory management, file systems, device drivers, and security isolation."
      },
      {
        code: "CS 141",
        title: "Computing Hardware & Microarchitecture",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Engineering",
        prerequisites: "CS 61 & EE 50",
        description: "Instruction set architectures (RISC-V), pipelining, branch prediction, superscalar execution, cache coherence, and memory consistency models."
      },
      {
        code: "STAT 111",
        title: "Introduction to Statistical Inference",
        department: "Statistics",
        credits: 4.0,
        category: "Mathematics",
        prerequisites: "STAT 110",
        description: "Estimation theory, hypothesis testing, confidence intervals, likelihood methods, Bayesian inference, and linear regression."
      }
    ]
  },

  // --- YEAR 3: JUNIOR YEAR ---
  {
    semester: 5,
    termName: "Junior Fall (Semester 5)",
    courses: [
      {
        code: "CS 181",
        title: "Machine Learning",
        department: "Computer Science",
        credits: 4.0,
        category: "AI & Data Science",
        prerequisites: "MATH 21B & STAT 110 & CS 120",
        description: "Supervised and unsupervised learning, regularized linear models, kernel methods, deep neural networks, EM algorithm, PCA, and reinforcement learning."
      },
      {
        code: "CS 165",
        title: "Data Systems",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 61 & CS 124",
        description: "Internal architecture of modern database engines: columnar vs row layouts, in-memory architectures, indexing, query execution engines, and write-optimized trees."
      },
      {
        code: "CS 143",
        title: "Computer Networks",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 61",
        description: "Packet switching, TCP/IP protocol suite, congestion control, BGP routing, SDN, wireless networking, and network security protocols."
      },
      {
        code: "CS 136",
        title: "Economics and Computation",
        department: "Computer Science",
        credits: 4.0,
        category: "Elective / Interdisciplinary",
        prerequisites: "CS 120",
        description: "Algorithmic game theory, auction design, mechanism design, multi-agent systems, prediction markets, and social choice."
      }
    ]
  },
  {
    semester: 6,
    termName: "Junior Spring (Semester 6)",
    courses: [
      {
        code: "CS 182",
        title: "Artificial Intelligence",
        department: "Computer Science",
        credits: 4.0,
        category: "AI & Data Science",
        prerequisites: "CS 120 & STAT 110",
        description: "Informed search, heuristic evaluation, constraint satisfaction, probabilistic graphical models, decision trees, reinforcement learning, and automated planning."
      },
      {
        code: "CS 171",
        title: "Visualization",
        department: "Computer Science",
        credits: 4.0,
        category: "Core Software",
        prerequisites: "CS 50 or CS 51",
        description: "Design and evaluation of visual data representations, visual encoding principles, interactive exploratory tools, high-dimensional data, and D3 visualization."
      },
      {
        code: "CS 152",
        title: "Programming Languages",
        department: "Computer Science",
        credits: 4.0,
        category: "Core Software",
        prerequisites: "CS 51 & CS 120",
        description: "Operational semantics, type safety proofs, lambda calculus, polymorphic types, continuation-passing style, and functional abstractions."
      },
      {
        code: "CS 127",
        title: "Cryptography",
        department: "Computer Science",
        credits: 4.0,
        category: "Theoretical CS",
        prerequisites: "CS 120 & STAT 110",
        description: "Pseudorandomness, symmetric key ciphers, public-key encryption (RSA, ECC), digital signatures, zero-knowledge proofs, and post-quantum cryptosystems."
      }
    ]
  },

  // --- YEAR 4: SENIOR YEAR ---
  {
    semester: 7,
    termName: "Senior Fall (Semester 7)",
    courses: [
      {
        code: "CS 153",
        title: "Compilers",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 61 & CS 124",
        description: "Lexical analysis, LR parsing, abstract syntax trees, LLVM intermediate representations, control-flow graphs, register allocation, and code generation."
      },
      {
        code: "CS 179",
        title: "Design of Usable Interactive Systems (HCI)",
        department: "Computer Science",
        credits: 4.0,
        category: "Core Software",
        prerequisites: "CS 50 or CS 51",
        description: "User research, cognitive modeling, interface prototyping, accessibility standards, empirical evaluation, and novel interactive paradigms."
      },
      {
        code: "CS 105",
        title: "Privacy, Ethics, and Technology",
        department: "Computer Science",
        credits: 4.0,
        category: "Embedded EthiCS",
        prerequisites: "Junior Standing",
        description: "Differential privacy, algorithmic bias, surveillance capitalism, autonomous systems governance, and legal frameworks around digital privacy."
      },
      {
        code: "CS 197",
        title: "AI Research Experience & Project Methods",
        department: "Computer Science",
        credits: 4.0,
        category: "AI & Data Science",
        prerequisites: "CS 181",
        description: "Formulation of novel research hypotheses, benchmark design, experimental rigor, reproducibility, and academic peer-review methodologies in AI."
      }
    ]
  },
  {
    semester: 8,
    termName: "Senior Spring (Semester 8)",
    courses: [
      {
        code: "CS 199",
        title: "Senior Capstone Design Project & Thesis",
        department: "Computer Science / SEAS",
        credits: 6.0,
        category: "Capstone",
        prerequisites: "Senior Standing in CSE",
        description: "Culminating capstone group thesis and design exhibit in Computer Science & Engineering. Includes specification, architectural design, implementation, and defense."
      },
      {
        code: "CS 145",
        title: "Cloud & Distributed Computing Systems",
        department: "Computer Science",
        credits: 4.0,
        category: "Computer Systems",
        prerequisites: "CS 161 & CS 143",
        description: "Consensus algorithms (Raft, Paxos), distributed key-value stores, fault tolerance, microservice architectures, and serverless computing."
      },
      {
        code: "CS 282",
        title: "Deep Generative Models & Frontier AI",
        department: "Computer Science",
        credits: 4.0,
        category: "AI & Data Science",
        prerequisites: "CS 181 & STAT 110",
        description: "Variational autoencoders, diffusion models, transformer architectures, reinforcement learning from human feedback (RLHF), and foundation models."
      }
    ]
  }
];
