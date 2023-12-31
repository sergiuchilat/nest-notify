import AppConfigInterface from '../interfaces/app-config.interface';
import { DbDriver } from '../interfaces/components/db-config.interface';
import jsonPlainConfig from '@/config/json-config.json';
import {generateDatabaseUrl} from '@/config/services/db.service';
export default class JsonPlainConfigStrategy {
  private readonly config: AppConfigInterface = null;

  constructor() {
    this.config = {
      app: {
        port: jsonPlainConfig.app.port.toString(),
        requestTimeout: jsonPlainConfig.app.requestTimeout,
        log: {
          custom: jsonPlainConfig.app.log.custom,
          levels: {
            error: {
              filename: jsonPlainConfig.app.log.levels.error.filename,
              maxFiles: jsonPlainConfig.app.log.levels.error.maxFiles
            },
            all: {
              filename: jsonPlainConfig.app.log.levels.all.filename,
              maxFiles: jsonPlainConfig.app.log.levels.all.maxFiles
            }
          }
        }
      },
      db: {
        host: jsonPlainConfig.db.host,
        port: jsonPlainConfig.db.port.toString(),
        user: jsonPlainConfig.db.user,
        password: jsonPlainConfig.db.password,
        name: jsonPlainConfig.db.name,
        driver: DbDriver[jsonPlainConfig.db.driver],
        url: null
      },
      mongo: {
        driver: 'mongodb',
        host: jsonPlainConfig.mongo.host,
        port: jsonPlainConfig.mongo.port.toString(),
        user: jsonPlainConfig.mongo.user,
        password: jsonPlainConfig.mongo.password,
        name: jsonPlainConfig.mongo.name,
        url: null
      },
      redis:{
        host: jsonPlainConfig.redis.host,
        port: jsonPlainConfig.redis.port.toString()
      },
      jwt: {
        secret: jsonPlainConfig.jwt.secret_key,
        expiresIn: jsonPlainConfig.jwt.token_expires_in
      },
      files:{
        uploadDirectory: jsonPlainConfig.files.uploadDirectory,
        uploadTempDirectory: jsonPlainConfig.files.uploadTempDirectory,
        uploadTempLifetime: Number(jsonPlainConfig.files.uploadTempLifetime),
        maxFileSize: Number(jsonPlainConfig.files.maxFileSize)
      },
      docs: {
        generate: jsonPlainConfig.docs.generate,
        path: jsonPlainConfig.docs.path,
        version: jsonPlainConfig.docs.version,
        title: jsonPlainConfig.docs.title,
        description: jsonPlainConfig.docs.description,
        authName: jsonPlainConfig.docs.authName
      },
      appInstall: {
        admin_username: jsonPlainConfig.appInstall.admin_username,
        admin_email: jsonPlainConfig.appInstall.admin_email,
        admin_password: jsonPlainConfig.appInstall.admin_password
      },
      telegram:{
        botToken: jsonPlainConfig.telegram.botToken
      },
      mail: {
        mailer: jsonPlainConfig.mail.mailer,
        host: jsonPlainConfig.mail.host,
        port: jsonPlainConfig.mail.port,
        username: jsonPlainConfig.mail.username,
        password: jsonPlainConfig.mail.password,
        encryption: jsonPlainConfig.mail.encryption,
        fromAddress: jsonPlainConfig.mail.fromAddress,
        fromName: jsonPlainConfig.mail.fromName,
        retryAttempts: Number(jsonPlainConfig.mail.retryAttempts),
        cronTimeout: jsonPlainConfig.mail.cronTimeout
      }
    };
    this.config.db.url = generateDatabaseUrl(this.config.db);
    this.config.mongo.url = generateDatabaseUrl(this.config.mongo);
  }

  public getConfig() {
    return this.config;
  }
}
