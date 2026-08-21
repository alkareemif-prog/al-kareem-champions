import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { bulkCreateQuestions } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ParsedQuestion = {
  prompt: string;
  q_type: "mcq" | "short" | "written";
  marks: number;
  options?: string[];
  correct_option?: number | null;
  word_limit?: number | null;
};

/** Minimal RFC-4180 CSV row splitter (handles quoted fields and escaped quotes). */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function parseQuestionCsv(
  raw: string,
  mode: "mcq" | "written",
): { questions: ParsedQuestion[]; errors: string[] } {
  const errors: string[] = [];
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { questions: [], errors: ["The CSV input is empty."] };

  const header = splitCsvLine(lines[0]!).map(norm);
  const hasHeader = header.includes("question");
  if (!hasHeader) {
    errors.push(
      mode === "mcq"
        ? 'Missing header row. Expected: Question, Option 1, Option 2, Option 3, Option 4, Correct Answer, Marks'
        : "Missing header row. Expected: Question, Max Marks",
    );
    return { questions: [], errors };
  }

  const indexOf = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const qi = indexOf("question");
  const marksIndex =
    mode === "mcq" ? indexOf("marks", "mark", "maxmarks") : indexOf("maxmarks", "marks", "mark");
  const optionIndexes =
    mode === "mcq"
      ? [
          indexOf("option1", "optiona", "a"),
          indexOf("option2", "optionb", "b"),
          indexOf("option3", "optionc", "c"),
          indexOf("option4", "optiond", "d"),
        ]
      : [];
  const correctIndex = mode === "mcq" ? indexOf("correctanswer", "correct", "answer") : -1;

  if (mode === "mcq") {
    if (optionIndexes.some((i) => i < 0)) errors.push("MCQ import needs 4 option columns.");
    if (correctIndex < 0) errors.push('MCQ import needs a "Correct Answer" column.');
  }
  if (marksIndex < 0) {
    errors.push(mode === "mcq" ? 'Missing "Marks" column.' : 'Missing "Max Marks" column.');
  }
  if (errors.length) return { questions: [], errors };

  const questions: ParsedQuestion[] = [];

  lines.slice(1).forEach((line, i) => {
    const rowNumber = i + 2;
    const cells = splitCsvLine(line);
    const prompt = (cells[qi] ?? "").trim();
    if (!prompt) {
      errors.push(`Row ${rowNumber}: question text is empty.`);
      return;
    }
    const marksRaw = (cells[marksIndex] ?? "").trim();
    const marks = marksRaw === "" ? 1 : Number(marksRaw);
    if (!Number.isFinite(marks) || marks < 0) {
      errors.push(`Row ${rowNumber}: marks must be a number.`);
      return;
    }

    if (mode === "written") {
      questions.push({ prompt, q_type: "written", marks, correct_option: null, word_limit: null });
      return;
    }

    const options = optionIndexes.map((index) => (cells[index] ?? "").trim());
    if (options.some((o) => o === "")) {
      errors.push(`Row ${rowNumber}: all 4 options are required.`);
      return;
    }

    const answerRaw = (cells[correctIndex] ?? "").trim();
    let correct = -1;
    const asNumber = Number(answerRaw);
    if (Number.isFinite(asNumber) && answerRaw !== "") {
      correct = asNumber - 1; // 1-based in the sheet
    } else if (/^[A-Da-d]$/.test(answerRaw)) {
      correct = answerRaw.toUpperCase().charCodeAt(0) - 65;
    } else {
      correct = options.findIndex((o) => o.toLowerCase() === answerRaw.toLowerCase());
    }
    if (correct < 0 || correct > 3) {
      errors.push(`Row ${rowNumber}: "Correct Answer" must be 1-4, A-D, or match an option.`);
      return;
    }

    questions.push({ prompt, q_type: "mcq", marks, options, correct_option: correct });
  });

  return { questions, errors };
}

export function BulkQuestionImport({
  competitionId,
  onImported,
}: {
  competitionId: string;
  onImported: () => void;
}) {
  const bulkInsert = useServerFn(bulkCreateQuestions);
  const [mode, setMode] = useState<"mcq" | "written">("mcq");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const importMut = useMutation({
    mutationFn: (questions: ParsedQuestion[]) =>
      bulkInsert({ data: { competitionId, questions } }),
    onSuccess: (res: any) => {
      toast.success(`Imported ${res?.inserted ?? 0} question(s)`);
      setText("");
      setErrors([]);
      onImported();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleImport() {
    const { questions, errors: parseErrors } = parseQuestionCsv(text, mode);
    setErrors(parseErrors);
    if (parseErrors.length > 0) {
      toast.error("Fix the CSV format issues before importing");
      return;
    }
    if (questions.length === 0) {
      toast.error("No questions found in the CSV");
      return;
    }
    importMut.mutate(questions);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    const { errors: parseErrors } = parseQuestionCsv(content, mode);
    setErrors(parseErrors);
    event.target.value = "";
  }

  const template =
    mode === "mcq"
      ? "Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Marks"
      : "Question,Max Marks";

  return (
    <div className="rounded-md border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-primary">Bulk Import</p>
        <div className="flex items-center gap-2">
          <Label htmlFor={`bulk-mode-${competitionId}`} className="text-xs">
            Format
          </Label>
          <select
            id={`bulk-mode-${competitionId}`}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "mcq" | "written");
              setErrors([]);
            }}
          >
            <option value="mcq">MCQ</option>
            <option value="written">Written / Short</option>
          </select>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Expected columns: <code>{template}</code>
      </p>

      <div className="mt-3 space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          aria-label="Upload CSV file"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
        />
        <Textarea
          value={text}
          rows={6}
          placeholder={`${template}\n"What is Zakat?",2.5%,5%,10%,20%,1,1`}
          onChange={(e) => setText(e.target.value)}
        />
        {errors.length > 0 && (
          <ul className="space-y-1 text-xs text-destructive">
            {errors.slice(0, 8).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {errors.length > 8 && <li>• …and {errors.length - 8} more issue(s)</li>}
          </ul>
        )}
        <Button
          variant="emerald"
          className="w-fit"
          disabled={!text.trim() || importMut.isPending}
          onClick={handleImport}
        >
          {importMut.isPending ? "Importing…" : "Import questions"}
        </Button>
      </div>
    </div>
  );
}
