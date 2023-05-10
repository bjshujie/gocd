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
import {FetchTaskAttributes} from "models/pipeline_configs/task";
import {CheckboxField, TextField} from "views/components/forms/input_fields";
import {
  UpstreamJobToFetchArtifactFromWidget
} from "views/pages/clicky_pipeline_config/tabs/job/tasks/fetch/upstream_job_info_to_fetch_artifact_from_widget";

interface BuiltInArtifactViewAttrs {
  attributes: FetchTaskAttributes;
  autoSuggestions: Stream<any>;
  readonly: boolean;
}

export class BuiltInFetchArtifactView extends MithrilViewComponent<BuiltInArtifactViewAttrs> {
  view(vnode: m.Vnode<BuiltInArtifactViewAttrs>) {
    const attributes = vnode.attrs.attributes;

    const sourceHelpText      = "特定作业的工件目录或文件相对于沙箱目录的路径。如果目录或文件不存在，则作业失败。";
    const destinationHelpText = "文档被提取到的目录的路径。如果目录已经存在，则会覆盖该目录。目录路径是相对于算法工作目录的。";

    return <div data-test-id="built-in-fetch-artifact-view">
      <UpstreamJobToFetchArtifactFromWidget {...vnode.attrs}/>
      <TextField helpText={sourceHelpText}
                 required={true}
                 label="源"
                 readonly={vnode.attrs.readonly}
                 errorText={attributes.errors().errorsForDisplay("source")}
                 property={attributes.source}/>
      <CheckboxField label="源为一个文件 (不是一个目录)"
                     readonly={vnode.attrs.readonly}
                     property={attributes.isSourceAFile}/>
      <TextField helpText={destinationHelpText}
                 label="目标"
                 readonly={vnode.attrs.readonly}
                 errorText={attributes.errors().errorsForDisplay("destination")}
                 property={attributes.destination}/>
    </div>;
  }
}
