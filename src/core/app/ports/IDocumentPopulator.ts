import { Document } from "../../index";

export interface IDocumentsPopulator {
  populate(document: Document): Promise<Document>;
}
