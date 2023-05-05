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

import {MithrilViewComponent} from "jsx/mithril-component";
import m from "mithril";
import Stream from "mithril/stream";
import {ButtonGroup, Cancel, Primary} from "views/components/buttons";
import {Form, FormBody} from "views/components/forms/form";
import {CheckboxField, NumberField, TextField} from "views/components/forms/input_fields";
import {ArtifactManagementAttrs} from "views/pages/server_configuration";
import {OperationState} from "../page_operations";
import styles from "./index.scss";

export class ArtifactsManagementWidget extends MithrilViewComponent<ArtifactManagementAttrs> {
  private ajaxOperationMonitor = Stream<OperationState>(OperationState.UNKNOWN);

  view(vnode: m.Vnode<ArtifactManagementAttrs>) {
    const artifactConfig      = vnode.attrs.artifactConfigVM().entity();
    const purgeStartDiskSpace = artifactConfig.purgeSettings().purgeStartDiskSpace;
    const purgeUptoDiskSpace  = artifactConfig.purgeSettings().purgeUptoDiskSpace;

    return <div data-test-id="artifacts-management-widget" class={styles.formContainer}>
      <FormBody>
        <div class={styles.formHeader}>
          <h2>配置您的文档设置</h2>
        </div>
        <div class={styles.formFields}>
          <Form compactForm={true}>
            <TextField label="文档目录位置"
                       property={artifactConfig.artifactsDir}
                       required={true}
                       errorText={artifactConfig.errors().errorsForDisplay("artifactsDir")}/>
            <CheckboxField property={artifactConfig.purgeSettings().cleanupArtifact}
                           label={"允许自动清理文档"}
                           onchange={() => {
                             artifactConfig.purgeSettings().purgeStartDiskSpace(undefined);
                             artifactConfig.purgeSettings().purgeUptoDiskSpace(undefined);
                           }}
                           value={true}
            />
            <div class={styles.purgeSettingsFields}>
              <NumberField property={purgeStartDiskSpace}
                           label={"当磁盘空间小于（GB）时开始清理"}
                           helpText={"当可用磁盘空间小于或等于指定的限制（以GB为单位）时，将启动项目的自动清理"}
                           readonly={!artifactConfig.cleanupArtifact()}
                           errorText={artifactConfig.purgeSettings()
                                                    .errors()
                                                    .errorsForDisplay("purgeStartDiskSpace")}
                           dataTestId={"purge-start-disk-space"}/>
              <NumberField property={purgeUptoDiskSpace}
                           helpText={"自动清理工件，直到指定的磁盘空间（以GB为单位）可用"}
                           label={"目标磁盘空间（GB）"}
                           readonly={!artifactConfig.cleanupArtifact()}
                           errorText={artifactConfig.purgeSettings()
                                                    .errors()
                                                    .errorsForDisplay("purgeUptoDiskSpace")}
                           dataTestId={"purge-upto-disk-space"}/>
            </div>
          </Form>
        </div>
        <div class={styles.buttons}>
          <ButtonGroup>
            <Cancel data-test-id={"cancel"} ajaxOperationMonitor={this.ajaxOperationMonitor} onclick={() => vnode.attrs.onCancel(vnode.attrs.artifactConfigVM())}>取消</Cancel>
            <Primary data-test-id={"save"} ajaxOperationMonitor={this.ajaxOperationMonitor}
                     ajaxOperation={() => vnode.attrs.onArtifactConfigSave(artifactConfig, vnode.attrs.artifactConfigVM().etag())}>
              保存
            </Primary>
          </ButtonGroup>
        </div>
      </FormBody>
    </div>;
  }
}
