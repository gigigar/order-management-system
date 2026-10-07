// Turns the form's "Agent / second Agent / second Agent's share" into agent_credit rows.
// The schema has already checked the combination (checkAgentCredits in validation.ts).
export function creditsFrom({
  agentId,
  secondAgentId,
  secondAgentShare,
}: {
  agentId: number | null;
  secondAgentId: number | null;
  secondAgentShare: number | null;
}): { agentId: number; sharePercent: number }[] {
  if (agentId === null) return [];
  if (secondAgentId === null || secondAgentShare === null) {
    return [{ agentId, sharePercent: 100 }];
  }
  return [
    { agentId, sharePercent: 100 - secondAgentShare },
    { agentId: secondAgentId, sharePercent: secondAgentShare },
  ];
}
