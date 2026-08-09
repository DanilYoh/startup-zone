export type LegalDocumentMode = "approved" | "draft" | "blocked";

export type PublicLegalConfig = {
  documentVersion: string;
  effectiveDate: string;
  mode: LegalDocumentMode;
  operatorAddress: string;
  operatorEmail: string;
  operatorName: string;
  processors: string[];
  registrationEnabled: boolean;
};
