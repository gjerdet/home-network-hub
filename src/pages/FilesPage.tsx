import { useState, useEffect, useRef } from "react";
import { getFiles, addFile, deleteFile, type UploadedFile } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download, FolderOpen, File } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFiles(getFiles()); }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        addFile({ name: file.name, size: file.size, type: file.type, data: reader.result as string });
        setFiles(getFiles());
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDownload = (f: UploadedFile) => {
    const a = document.createElement("a");
    a.href = f.data;
    a.download = f.name;
    a.click();
  };

  const handleDelete = (id: string) => { deleteFile(id); setFiles(getFiles()); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Filer</h1>
          <p className="text-sm text-muted-foreground mt-1">{files.length} filer lastet opp</p>
        </div>
        <div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <Button onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Last opp</Button>
        </div>
      </div>

      <div className="space-y-2">
        {files.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <File className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{f.name}</div>
              <div className="text-xs text-muted-foreground">{formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString("nb-NO")}</div>
            </div>
            <button onClick={() => handleDownload(f)} className="text-muted-foreground hover:text-primary"><Download className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Ingen filer lastet opp</p>
          <p className="text-sm mt-1">Filer lagres lokalt i nettleseren</p>
        </div>
      )}
    </div>
  );
}
