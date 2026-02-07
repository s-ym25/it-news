export async function notifyLine(
  articleCount: number,
  siteUrl: string
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!token || !userId) {
    console.warn(
      "LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID not set. Skipping notification."
    );
    return;
  }

  const message = {
    to: userId,
    messages: [
      {
        type: "text",
        text: `IT News Daily\n\n本日のニュース ${articleCount}件 が準備できました。\n\n${siteUrl}`,
      },
    ],
  };

  try {
    const response = await fetch(
      "https://api.line.me/v2/bot/message/push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LINE API error: ${response.status} ${body}`);
    }

    console.log("LINE notification sent successfully");
  } catch (error) {
    console.error("Failed to send LINE notification:", error);
  }
}
