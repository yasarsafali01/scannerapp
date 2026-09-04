import * as Sharing from "expo-sharing";

export async function shareFile(uri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
