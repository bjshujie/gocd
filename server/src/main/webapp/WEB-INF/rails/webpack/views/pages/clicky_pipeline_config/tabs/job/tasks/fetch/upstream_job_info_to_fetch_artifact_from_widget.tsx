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

import {MithrilComponent} from "jsx/mithril-component";
import m from "mithril";
import Stream from "mithril/stream";
import {FetchTaskAttributes} from "models/pipeline_configs/task";
import {AutocompleteField} from "views/components/forms/autocomplete";
import {JobsAutocompletionProvider} from "views/pages/clicky_pipeline_config/tabs/job/tasks/fetch/jobs_autocompletion_provider";
import {PipelinesAutocompletionProvider} from "views/pages/clicky_pipeline_config/tabs/job/tasks/fetch/pipelines_autocompletion_provider";
import {StagesAutocompletionProvider} from "views/pages/clicky_pipeline_config/tabs/job/tasks/fetch/stages_autocompletion_provider";

export interface Attrs {
  attributes: FetchTaskAttributes;
  autoSuggestions: Stream<any>;
  onJobSuggestionChange?: () => any;
  readonly: boolean;
}

export interface State {
  pipelineSuggestions: PipelinesAutocompletionProvider;
  stageSuggestions: StagesAutocompletionProvider;
  jobSuggestions: JobsAutocompletionProvider;
}

export class UpstreamJobToFetchArtifactFromWidget extends MithrilComponent<Attrs, State> {
  oninit(vnode: m.Vnode<Attrs, State>) {
    const pipeline    = vnode.attrs.attributes.pipeline;
    const stage       = vnode.attrs.attributes.stage;
    const suggestions = vnode.attrs.autoSuggestions;

    vnode.state.pipelineSuggestions = new PipelinesAutocompletionProvider(suggestions);
    vnode.state.stageSuggestions    = new StagesAutocompletionProvider(pipeline, suggestions);
    vnode.state.jobSuggestions      = new JobsAutocompletionProvider(pipeline, stage, suggestions);
  }

  view(vnode: m.Vnode<Attrs, State>) {
    const attributes = vnode.attrs.attributes;

    const pipelineHelpText = "作业的算法所依赖的直接上游算法或上游算法之一的祖先算法的名称。该算法（形式为从管道/路径/到上游管道的获取）应为可访问。如果未指定，则默认为当前管道。";
    const stageHelpText    = "要从中提取文档的阶段的名称。";
    const jobHelpText      = "要从中获取文档的作业的名称。";

    let onJobSuggestionChange = () => {
      //do nothing;
    };
    if (vnode.attrs.onJobSuggestionChange) {
      onJobSuggestionChange = vnode.attrs.onJobSuggestionChange;
    }

    return <div>
      <AutocompleteField helpText={pipelineHelpText}
                         required={false}
                         autoEvaluate={!vnode.attrs.readonly}
                         readonly={vnode.attrs.readonly}
                         errorText={attributes.errors().errorsForDisplay("pipeline")}
                         provider={vnode.state.pipelineSuggestions}
                         onchange={vnode.state.stageSuggestions.update.bind(vnode.state.stageSuggestions)}
                         label="算法"
                         property={attributes.pipeline}/>
      <AutocompleteField helpText={stageHelpText}
                         autoEvaluate={!vnode.attrs.readonly}
                         readonly={vnode.attrs.readonly}
                         errorText={attributes.errors().errorsForDisplay("stage")}
                         provider={vnode.state.stageSuggestions}
                         onchange={vnode.state.jobSuggestions.update.bind(vnode.state.jobSuggestions)}
                         required={true}
                         label="阶段"
                         property={attributes.stage}/>
      <AutocompleteField helpText={jobHelpText}
                         autoEvaluate={!vnode.attrs.readonly}
                         readonly={vnode.attrs.readonly}
                         errorText={attributes.errors().errorsForDisplay("job")}
                         provider={vnode.state.jobSuggestions}
                         onchange={onJobSuggestionChange}
                         required={true}
                         label="作业"
                         property={attributes.job}/>
    </div>;
  }
}
