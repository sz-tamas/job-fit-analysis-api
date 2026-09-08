export interface CvDocument {
    filename: string;
    contentBase64: string;
}

export interface LinkedInProfile {
    url: string;
    content: string;
}

export type CandidateSource =
    | { type: 'pdf'; filename: string }
    | { type: 'linkedinProfile'; url: string };

export type Candidate =
    | { type: 'pdf'; document: CvDocument }
    | { type: 'linkedinProfile'; profile: LinkedInProfile };
