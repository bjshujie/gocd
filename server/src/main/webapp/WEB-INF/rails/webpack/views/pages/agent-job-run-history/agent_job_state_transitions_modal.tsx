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

import {timeFormatter as TimeFormatter} from "helpers/time_formatter";
import m from "mithril";
import {JobRunHistoryJSON} from "models/agent_job_run_history";
import {JobState} from "models/shared/job_state";
import {Modal, Size} from "views/components/modal";
import {Table} from "views/components/table";
import * as Tooltip from "views/components/tooltip";
import styles from "./index.scss";

export class AgentJobStateTransitionModal extends Modal {
  private readonly job: JobRunHistoryJSON;

  constructor(job: JobRunHistoryJSON) {
    super(Size.small);
    this.job = job;
  }

  body(): m.Children {
    const tableData = this.job.job_state_transitions.map((transition) => {
      return [<i>{transition.state}</i>, TimeFormatter.format(transition.state_change_time)];
    });

    const waitTimeContent     = <div>等待时间是作业等待分配节点所花费的时间。这是作业从<b><i>计划</i></b>到<b><i>分配</i></b>所花费的总时间。</div>;
    const buildingTimeContent = <div>构建时间是在节点上构建作业所花费的时间。这是总数作业从<b><i>分配</i></b>给它的时间到<b><i>完成</i></b>所花费的时间。</div>;
    const totalTimeContent    = <div>总时间是指作业从计划到完成所花费的时间。这是作业从<b><i>计划</i></b>到<b><i>完成</i></b>所花费的总时间。</div>;

    return <div data-test-id={`job-state-transitions-for-${this.jobRepresentation()}`}>
      <div class={styles.jobStateTransitionInformationContainer} data-test-id="additional-information-container">

        <div data-test-id="key-value-pair" class={styles.keyValuePair}>
          <div class={styles.key} data-test-id="key-job">作业</div>
          <span class={styles.value} data-test-id="value-job">
            : {this.jobRepresentation()}
          </span>
        </div>

        <div data-test-id="key-value-pair" class={styles.keyValuePair}>
          <div class={styles.key} data-test-id="key-wait-time">
            等待时间
            <Tooltip.Info content={waitTimeContent}/>
          </div>
          <span class={styles.value} data-test-id="value-wait-time">
            : {this.findTimeDifference("Scheduled", "Assigned")}
          </span>
        </div>

        <div data-test-id="key-value-pair" class={styles.keyValuePair}>
          <div class={styles.key} data-test-id="key-building-time">
            构建时间
            <Tooltip.Info content={buildingTimeContent}/>
          </div>
          <span class={styles.value} data-test-id="value-building-time">
            : {this.findTimeDifference("Assigned", "Completed")}
          </span>
        </div>

        <div data-test-id="key-value-pair" class={styles.keyValuePair}>
          <div class={styles.key} data-test-id="key-total-time">
            总用时
            <Tooltip.Info content={totalTimeContent}/>
          </div>
          <span class={styles.value} data-test-id="value-total-time">
            : {this.findTimeDifference("Scheduled", "Completed")}
          </span>
        </div>
      </div>
      <Table data={tableData} headers={["节点状态", "时间"]}/>
    </div>;
  }

  title(): string {
    return "工作状态转换";
  }

  private jobRepresentation() {
    return `${this.job.pipeline_name}/${this.job.pipeline_counter}/${this.job.stage_name}/${this.job.stage_counter}/${this.job.job_name}`;
  }

  private findTimeDifference(from: JobState, to: JobState) {
    const fromState = this.job.job_state_transitions.find((t) => t.state === from);
    const toState   = this.job.job_state_transitions.find((t) => t.state === to);

    if (!fromState || !toState) {
      throw new Error(`Expected to find a Job State Transition entry for state(s): ${from} and ${to}`);
    }

    return TimeFormatter.formattedTimeDiff(fromState.state_change_time, toState.state_change_time);
  }
}
