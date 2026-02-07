/**
 * notify.ts — LINE通知スクリプト
 *
 * LINE Messaging API を使って、ユーザーのLINEに
 * 「本日のニュース X件 が準備できました」というメッセージを送信する。
 *
 * LINE_CHANNEL_ACCESS_TOKEN と LINE_USER_ID が未設定の場合はスキップする。
 */

/**
 * notifyLine — LINEにPush通知を送信する
 *
 * @param articleCount - 本日の記事数（例: 30）
 * @param siteUrl - ニュースサイトのURL（例: "https://it-news-eight.vercel.app"）
 */
export async function notifyLine(
  articleCount: number,
  siteUrl: string
): Promise<void> {
  // 環境変数からLINEの認証情報を取得
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN; // LINEチャネルのアクセストークン
  const userId = process.env.LINE_USER_ID; // 通知先のLINEユーザーID

  // どちらかが未設定なら通知をスキップ
  if (!token || !userId) {
    console.warn(
      "LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID not set. Skipping notification."
    );
    return;
  }

  // LINE Messaging API に送信するメッセージの構造
  // 公式ドキュメント: https://developers.line.biz/ja/reference/messaging-api/#send-push-message
  const message = {
    to: userId, // 送信先のユーザーID
    messages: [
      {
        type: "text", // メッセージの種類（テキスト）
        // テンプレートリテラル（`...`）で動的な文字列を作成
        // \n = 改行
        text: `IT News Daily\n\n本日のニュース ${articleCount}件 が準備できました。\n\n${siteUrl}`,
      },
    ],
  };

  try {
    // fetch: HTTPリクエストを送信する関数（ブラウザのfetchと同じ）
    // LINE Messaging API の「Pushメッセージ送信」エンドポイントにPOSTリクエストを送る
    const response = await fetch(
      "https://api.line.me/v2/bot/message/push",
      {
        method: "POST", // HTTPメソッド: データを送信する時はPOST
        headers: {
          "Content-Type": "application/json", // 送信データの形式はJSON
          // Authorization: APIの認証ヘッダー。"Bearer トークン" の形式
          Authorization: `Bearer ${token}`,
        },
        // body: 送信するデータ。JavaScriptオブジェクトをJSON文字列に変換して送る
        body: JSON.stringify(message),
      }
    );

    // response.ok: HTTPステータスコードが200番台（成功）かどうか
    if (!response.ok) {
      // エラーの場合、レスポンス本文を読み取ってエラーメッセージにする
      const body = await response.text();
      throw new Error(`LINE API error: ${response.status} ${body}`);
    }

    console.log("LINE notification sent successfully");
  } catch (error) {
    // ネットワークエラーやAPIエラーが発生した場合
    // 通知失敗は致命的ではないので、エラーログだけ出してプロセスは続行する
    console.error("Failed to send LINE notification:", error);
  }
}
