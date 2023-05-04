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

import _ from "lodash";
import m from "mithril";
import Stream from "mithril/stream";
import {AccessTokenCRUD} from "models/access_tokens/access_token_crud";
import {AccessToken, AccessTokens} from "models/access_tokens/types";
import {AdminAccessTokenCRUD} from "models/admin_access_tokens/admin_access_token_crud";
import * as Buttons from "views/components/buttons";
import {FlashMessage, MessageType} from "views/components/flash_message";
import {CopyField, Size, TextAreaField} from "views/components/forms/input_fields";
import {Spinner} from "views/components/spinner";
import {BaseModal, RevokeTokenModal} from "views/pages/access_tokens/commons/modals";
import styles from "views/pages/access_tokens/index.scss";
import {OperationState} from "views/pages/page_operations";

export class GenerateTokenModal extends BaseModal {
  constructor(accessTokens: Stream<AccessTokens>,
              onSuccessfulSave: (msg: m.Children) => void,
              onError: (msg: m.Children) => void) {
    super(accessTokens, Stream(AccessToken.new()), onSuccessfulSave, onError);
    this.closeModalOnOverlayClick = false;
  }

  title(): string {
    return "创建访问令牌";
  }

  body(): m.Children {
    if (this.operationState() === OperationState.IN_PROGRESS) {
      return <div class={styles.spinnerContainer}>
        <Spinner/>
      </div>;
    }

    if (this.hasToken()) {
      return (<div>
        <FlashMessage type={MessageType.info}
                      message="请确保现成复制了您的新个人访问令牌. 您将无法再看到令牌信息!"/>
        <CopyField size={Size.MATCH_PARENT} property={this.accessToken().token} buttonDisableReason=""/>
      </div>);
    } else {
      return <TextAreaField label={"说明"}
                            required={true}
                            property={this.accessToken().description}
                            resizable={false}
                            rows={5}
                            size={Size.MATCH_PARENT}
                            errorText={this.accessToken().errors().errorsForDisplay("description")}
                            helpText="这个令牌是用来做什么的?"/>;

    }
  }

  buttons(): m.ChildArray {
    if (this.hasToken()) {
      return [<Buttons.Cancel data-test-id="button-close" onclick={() => this.close()}>Close</Buttons.Cancel>];
    } else {
      return [
        <Buttons.Primary data-test-id="button-save"
                         ajaxOperationMonitor={this.operationState}
                         ajaxOperation={this.performOperation.bind(this)}>生成</Buttons.Primary>,
        <Buttons.Cancel data-test-id="button-cancel" ajaxOperationMonitor={this.operationState}
                        onclick={() => this.close()}>取消</Buttons.Cancel>];
    }
  }

  protected operationPromise(): Promise<any> {
    return AccessTokenCRUD.create(this.accessToken());
  }

  protected afterSuccess() {
    this.accessTokens().push(this.accessToken);
    this.onSuccessfulSave("访问令牌被成功创建.");
  }

  private hasToken() {
    const token = this.accessToken().token();
    return !_.isEmpty(token);
  }
}

export class RevokeAccessTokenForCurrentUser extends RevokeTokenModal {
  protected operationPromise(): Promise<any> {
    return AccessTokenCRUD.revoke(this.accessToken(), this.cause()).finally(() => this.close());
  }
}

export class RevokeAccessTokenByAdmin extends RevokeTokenModal {
  protected operationPromise(): Promise<any> {
    return AdminAccessTokenCRUD.revoke(this.accessToken(), this.cause()).finally(() => this.close());
  }
}
