import { Document, IDocumentsPopulator } from "../../core";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export class DocxDocumentsPopulator implements IDocumentsPopulator {
  async populate(document: Document): Promise<Document> {
    const blob = await this.generateDocument(document.templatePath, document.data);
    await this.saveBlob(blob, document.name);
    return document;
  }

  private async loadTemplate(templatePath: string): Promise<ArrayBuffer> {
    const response = await fetch(templatePath);
    return response.arrayBuffer();
  }

  private async generateDocument(
    templatePath: string,
    data: Record<string, string>
  ): Promise<Blob> {
    const templateBuffer = await this.loadTemplate(templatePath);

    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return blob;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
