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
 * WITHOUT WARREXECIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import m from "mithril";
import {ExecTask, ExecTaskAttributes, Task} from "models/pipeline_configs/task";
import {PluginInfos} from "models/shared/plugin_infos_new/plugin_info";
import {Size, TextAreaField, TextField} from "views/components/forms/input_fields";
import {AbstractTaskModal} from "views/pages/clicky_pipeline_config/tabs/job/tasks/abstract";
import {OnCancelView} from "views/pages/clicky_pipeline_config/tabs/job/tasks/common/on_cancel_view";

export class ExecTaskModal extends AbstractTaskModal {
  private readonly task: ExecTask;
  private readonly showOnCancel: boolean;
  private readonly pluginInfos: PluginInfos;
  private readonly readonly: boolean;

  constructor(task: Task | undefined, showOnCancel: boolean, onAdd: (t: Task) => Promise<any>, pluginInfos: PluginInfos, readonly: boolean) {
    super(onAdd, readonly);
    this.task         = task ? task : new ExecTask("", [], undefined,undefined, [], undefined);
    this.pluginInfos  = pluginInfos;
    this.showOnCancel = showOnCancel;
    this.readonly     = readonly;
  }

  body(): m.Children {
    const attributes = this.task.attributes() as ExecTaskAttributes;

    let argumentView: m.Children;
    if (attributes.args()) {
      argumentView = <TextField helpText="命令参数"
                                errorText={attributes.errors().errorsForDisplay("args")}
                                readonly={this.readonly}
                                label="Arguments"
                                property={attributes.args}/>;
    } else {
      argumentView = <TextAreaField helpText="在每一个新行输入参数"
                                    errorText={attributes.errors().errorsForDisplay("args")}
                                    readonly={this.readonly}
                                    rows={5}
                                    size={Size.MATCH_PARENT}
                                    resizable={true}
                                    label="参数"
                                    property={attributes.argsStream.bind(attributes)}/>;
    }

    return <div data-test-id="exec-task-modal">
      {this.renderFlashMessage()}
      <h3>基本设置</h3>
      <TextField helpText="要执行的命令或脚本，相对于工作目录"
                 errorText={attributes.errors().errorsForDisplay("command")}
                 readonly={this.readonly}
                 required={true}
                 label="命令"
                 placeholder="ls"
                 property={attributes.command}/>
      {argumentView}
      <TextField helpText="命令或脚本的执行目录。该目录总是相对于节点检出的资料的目录."
                 label="工作目录"
                 readonly={this.readonly}
                 errorText={attributes.errors().errorsForDisplay("workingDirectory")}
                 property={attributes.workingDirectory}/>
      <OnCancelView showOnCancel={this.showOnCancel}
                    readonly={this.readonly}
                    onCancel={attributes.onCancel}
                    pluginInfos={this.pluginInfos}
                    runIf={attributes.runIf}/>
    </div>;
  }

  title(): string {
    return "执行任务";
  }

  getTask(): Task {
    return this.task;
  }
}
