/*
 * Copyright 2023 Thoughtworks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {ApiRequestBuilder, ApiResult, ApiVersion} from "helpers/api_request_builder";
import {SparkRoutes} from "helpers/spark_routes";
import _ from "lodash";

export interface ServerHealthMessage {
  message: string;
  detail: string;
  level: string;
  time: string;
}

export class ServerHealthMessages {
  static API_VERSION = ApiVersion.v1;
  private readonly messages: ServerHealthMessage[];

  constructor(messages: ServerHealthMessage[]) {
    this.messages = messages;
  }

  static fromJSON(messages: ServerHealthMessage[]) {
    return new ServerHealthMessages(messages);
  }

  static all() {
    return ApiRequestBuilder.GET(SparkRoutes.serverHealthMessagesPath(), this.API_VERSION)
                            .then((result: ApiResult<string>) => result.map((body) => {
                              return ServerHealthMessages.fromJSON(JSON.parse(body));
                            }));
  }

  countErrors   = () => _.filter(this.messages, {level: "ERROR"}).length;
  countWarnings = () => _.filter(this.messages, {level: "WARNING"}).length;

  hasMessages(): boolean {
    return this.messages.length > 0;
  }

  summaryMessage(): string {
    const messages = [];
    if (this.countErrors() > 0) {
      messages.push("错误");
    }
    if (this.countWarnings() > 0) {
      messages.push("警告");
    }
    return _.join(messages, " 和 ");
  }

  collect<T, K extends keyof T>(cb: any): Array<T[K]> {
    return _.map(this.messages, cb);
  }
}
