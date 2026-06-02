import { prisma } from "@/lib/prisma";

export const DEMO_BOOK_TITLE = "Biology 101: Cell Biology (Demo)";

export function shouldAutoSeed(): boolean {
  const flag = process.env.SEED_DEMO;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.NODE_ENV !== "production";
}

const DEMO_PAGES = [
  {
    pageNumber: 1,
    rawText:
      "The cell membrane (plasma membrane) is a lipid bilayer that surrounds and protects the cell. It is selectively permeable, regulating the entry and exit of molecules through active transport (requiring ATP) and passive transport (diffusion/osmosis). The fluid mosaic model describes its structure as proteins floating in a lipid bilayer.",
    flashcards: [
      { front: "What is the primary structure of the cell membrane?", back: "A selectively permeable lipid bilayer described by the fluid mosaic model, with proteins floating within it." },
      { front: "Define selectively permeable in the context of the cell membrane.", back: "It regulates the entry and exit of substances, allowing some to pass through easily while blocking or controlling others." },
      { front: "What are the two main transport mechanisms across the cell membrane?", back: "Active transport (which requires energy/ATP) and passive transport (diffusion and osmosis, which do not require energy)." },
      { front: "What is the difference between active and passive transport?", back: "Active transport requires cellular energy (ATP) to move molecules against a concentration gradient, while passive transport relies on natural diffusion down a gradient." },
      { front: "What model describes the dynamic structure of the plasma membrane?", back: "The Fluid Mosaic Model, which represents proteins moving dynamically in a fluid phospholipid bilayer." },
    ],
  },
  {
    pageNumber: 2,
    rawText:
      "Mitochondria are the powerhouses of the cell, generating adenosine triphosphate (ATP) through cellular respiration. The mitochondrion has a double membrane: the outer membrane and the folded inner membrane (cristae). The space inside the inner membrane is the matrix. Cellular respiration consists of glycolysis, the Krebs cycle, and the electron transport chain (ETC).",
    flashcards: [
      { front: "What is the main function of the mitochondria?", back: "To produce energy in the form of ATP (adenosine triphosphate) through cellular respiration." },
      { front: "Describe the double-membrane structure of a mitochondrion.", back: "It consists of a smooth outer membrane and a folded inner membrane known as cristae." },
      { front: "What is the mitochondrial matrix?", back: "The fluid-filled space enclosed by the inner membrane where the Krebs cycle takes place." },
      { front: "What are the three main stages of cellular respiration?", back: "Glycolysis (in the cytoplasm), the Krebs cycle (in the matrix), and the Electron Transport Chain (on the cristae)." },
      { front: "Why is the inner membrane of the mitochondrion folded?", back: "The folds (cristae) increase surface area, maximizing space for the electron transport chain and ATP synthesis." },
    ],
  },
  {
    pageNumber: 3,
    rawText:
      "The nucleus is the cell's control center, containing DNA (deoxyribonucleic acid) organized into chromatin. The nucleus is surrounded by a double nuclear envelope with nuclear pores that control the transport of molecules (like RNA and proteins). The nucleolus inside the nucleus is responsible for synthesizing ribosomal RNA (rRNA) and assembling ribosomes.",
    flashcards: [
      { front: "What is the primary role of the cell's nucleus?", back: "It acts as the control center, storing genetic material (DNA) and directing cellular activities." },
      { front: "How is the nucleus separated from the cytoplasm?", back: "By the nuclear envelope, a double-membrane structure containing nuclear pores for macromolecule transport." },
      { front: "What is the function of nuclear pores?", back: "To regulate the exchange of materials, such as RNA, proteins, and ribosomal subunits, between the nucleus and cytoplasm." },
      { front: "What structure within the nucleus produces ribosomes?", back: "The nucleolus, which synthesizes ribosomal RNA (rRNA) and assembles ribosome subunits." },
      { front: "How is DNA organized inside the nucleus when the cell is not dividing?", back: "As chromatin, which consists of DNA wound around histone proteins in a loose, threadlike structure." },
    ],
  },
];

export async function findDemoBook() {
  return prisma.book.findFirst({
    where: { title: DEMO_BOOK_TITLE },
    include: {
      pages: { include: { _count: { select: { flashcards: true } } } },
    },
  });
}

export async function ensureDemoBook() {
  const existing = await findDemoBook();
  if (existing) return existing;

  return prisma.book.create({
    data: {
      title: DEMO_BOOK_TITLE,
      author: "Dr. Elizabeth Blackburn",
      subject: "Biology",
      pages: {
        create: DEMO_PAGES.map((p) => ({
          pageNumber: p.pageNumber,
          rawText: p.rawText,
          flashcards: { create: p.flashcards },
        })),
      },
    },
    include: {
      pages: { include: { _count: { select: { flashcards: true } } } },
    },
  });
}
