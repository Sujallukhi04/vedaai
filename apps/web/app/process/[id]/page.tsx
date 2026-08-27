import { ProcessingProgress } from "@/components/ProcessingProgress";

export default function ProcessPage({ params }: { params: { id: string } }) {
  return (
    <div className="py-8">
      <ProcessingProgress jobId={params.id} />
    </div>
  );
}
