export interface NotificationSchema {
    token: string;
    body: string;
    title: string;
    type: "ios" | "android";
  }

export interface DifusionNotificationSchema {
  tokens: string[];
  body: string;
  title: string;
  type: "ios" | "android";
}
  