import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  async onModuleInit() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      console.warn(
        '[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH not set - notifications disabled',
      );
      return;
    }

    try {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      console.log('[Firebase] Initialized successfully');
    } catch (error) {
      console.error('[Firebase] Initialization failed:', error);
    }
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: deviceToken,
    };

    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('[Firebase] Send notification failed:', error);
      throw error;
    }
  }

  async sendMulticast(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<admin.messaging.BatchResponse> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: deviceTokens,
    };

    try {
      // sendMulticast is not directly available, use sendEach instead
      const results = await Promise.all(
        deviceTokens.map((token) =>
          admin.messaging().send({ ...message, token }),
        ),
      );
      return results as any;
    } catch (error) {
      console.error('[Firebase] Send multicast failed:', error);
      throw error;
    }
  }

  async subscribeToTopic(deviceTokens: string[], topic: string): Promise<any> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    try {
      const response = await admin
        .messaging()
        .subscribeToTopic(deviceTokens, topic);
      return response;
    } catch (error) {
      console.error('[Firebase] Subscribe to topic failed:', error);
      throw error;
    }
  }

  async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<any> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(deviceTokens, topic);
      return response;
    } catch (error) {
      console.error('[Firebase] Unsubscribe from topic failed:', error);
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
    };

    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('[Firebase] Send to topic failed:', error);
      throw error;
    }
  }
}
