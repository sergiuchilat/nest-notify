import AppConfigInterface from '../interfaces/app-config.interface';
import { DbDriver } from '../interfaces/components/db-config.interface';
import { generateDatabaseUrl } from '@/config/services/db.service';
import * as dotenv from 'dotenv';
dotenv.config();

export default class EnvConfigStrategy {
  private readonly config: AppConfigInterface = null;

  constructor() {
    this.config = {
      app: {
        port: process.env.APP_PORT,
        requestTimeout: Number(process.env.APP_REQUEST_TIMEOUT),
        log: {
          custom: process.env.APP_LOG_CUSTOM === 'true',
          levels: {
            error: {
              filename: process.env.APP_LOG_ERROR_FILENAME,
              maxFiles: process.env.APP_LOG_ERROR_MAX_FILES
            },
            all: {
              filename: process.env.APP_LOG_ALL_FILENAME,
              maxFiles: process.env.APP_LOG_ALL_MAX_FILES
            }
          }
        }
      },
      db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        driver: DbDriver[process.env.DB_DRIVER],
        url: null
      },
      mongo: {
        driver: 'mongodb',
        host: process.env.MONGO_HOST,
        port: process.env.MONGO_PORT,
        user: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
        name: process.env.MONGO_DB_NAME,
        url: null
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      jwt: {
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: process.env.JWT_TOKEN_EXPIRES_IN
      },
      files: {
        uploadDirectory: process.env.FILES_UPLOAD_DIR,
        uploadTempDirectory: process.env.FILES_UPLOAD_TEMP_DIR,
        uploadTempLifetime: Number(process.env.FILES_UPLOAD_TEMP_LIFETIME),
        maxFileSize: Number(process.env.FILES_MAX_SIZE)
      },
      docs: {
        generate: process.env.DOCS_GENERATE === 'true',
        path: process.env.DOCS_PATH,
        version: process.env.DOCS_VERSION,
        title: process.env.DOCS_TITLE,
        description: process.env.DOCS_DESCRIPTION,
        authName: process.env.DOCS_AUTH_NAME
      },
      appInstall: {
        admin_username: process.env.APP_INSTALL_ADMIN_USERNAME,
        admin_email: process.env.APP_INSTALL_ADMIN_EMAIL,
        admin_password: process.env.APP_INSTALL_ADMIN_PASSWORD
      },
      telegram:{
        botToken: process.env.TELEGRAM_BOT_TOKEN
      },
      mail: {
        mailer: process.env.MAIL_MAILER,
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD,
        encryption: process.env.MAIL_ENCRYPTION,
        fromAddress: process.env.MAIL_FROM_ADDRESS,
        fromName: process.env.MAIL_FROM_NAME,
        retryAttempts: Number(process.env.MAIL_RETRY_ATTEMPTS),
        cronTimeout: process.env.MAIL_CRON_TIMEOUT
      }
    };

    this.config.db.url = generateDatabaseUrl(this.config.db);
    this.config.mongo.url = generateDatabaseUrl(this.config.mongo);
  }

  public getConfig() {
    return this.config;
  }
}
