import { v4 as uuidv4 } from "uuid";

type DocumentData = Record<string, any>;

export class Document {
  static CreateParticipationCertificate(name: string, data: DocumentData): Document {
    return new Document(uuidv4(), name, "assets/participationCertificateTemplate.docx", data);
  }

  private constructor(
    private readonly id: string,
    readonly name: string,
    readonly templatePath: string,
    readonly data: DocumentData
  ) {}
}
