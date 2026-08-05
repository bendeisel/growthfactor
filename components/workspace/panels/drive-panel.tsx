import { PanelPlaceholder } from "@/components/workspace/panels/panel-placeholder";

export function DrivePanel() {
  return (
    <PanelPlaceholder
      phase="Phase 3"
      source="Google Drive API"
      features={[
        "Recent files across every Drive Ben has access to",
        "Folder browser with breadcrumb navigation",
        "Drag-and-drop upload straight into the current folder",
        "Open in Drive, copy link, and hand a file to Megatron for reading",
      ]}
      needs={[
        "GOOGLE_OAUTH_CLIENT_ID",
        "GOOGLE_OAUTH_CLIENT_SECRET",
        "scope: drive.readonly + drive.file",
      ]}
    />
  );
}
