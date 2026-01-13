export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface BriefData {
  company: {
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
  };
  campaign: {
    name: string;
    type: string;
    goal: string;
    message: string;
    kpis: string[];
  };
  target_audience: {
    demographics: {
      gender: string;
      age: string;
      location: string;
    };
    psychographics: string;
    persona: string;
  };
  channels: string[];
  timeline: {
    start: string;
    end: string;
    important_dates: string[];
  };
  budget: {
    total: string;
    distribution: Record<string, string>;
  };
  competitors: string[];
  notes: string;
}
