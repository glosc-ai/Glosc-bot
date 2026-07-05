export function parseNodeIdArg(args: string): string | null {
  const [nodeId] = args.trim().split(/\s+/);
  return nodeId?.length ? nodeId : null;
}
