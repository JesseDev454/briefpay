declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      workspaceId: string;
      role: "owner" | "member";
    };
  }
}
