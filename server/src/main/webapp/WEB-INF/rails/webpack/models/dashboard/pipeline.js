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

import {SparkRoutes} from "helpers/spark_routes";
import {PipelineInstance} from "models/dashboard/pipeline_instance";
import {AjaxHelper} from "helpers/ajax_helper";
import {VMRoutes} from "helpers/vm_routes";
import Stream from "mithril/stream";
import _ from "lodash";

export const Pipeline = function (info) {
  const self = this;
  this.name  = info.name;

  this.canAdminister = info.can_administer;
  this.settingsPath  = SparkRoutes.pipelineEditPath('pipelines', info.name, 'general');

  this.historyPath = VMRoutes.pipelineHistoryPath(info.name);
  this.instances   = _.map(info._embedded.instances, (instance) => new PipelineInstance(instance, info.name));

  this.isPaused    = info.pause_info.paused;
  this.pausedBy    = info.pause_info.paused_by;
  this.pausedCause = info.pause_info.pause_reason;
  this.pausedAt    = info.pause_info.paused_at;
  this.canPause    = info.can_pause;

  this.isUsingTemplate = info.template_info.is_using_template;
  this.templateName = info.template_info.template_name;

  this.isLocked  = info.locked;
  this.canUnlock = info.can_unlock;

  this.isDefinedInConfigRepo = () => info.from_config_repo;

  this.getConfigRepoId = () => info.config_repo_id;

  this.getConfigRepoMaterialUrl = () => info.config_repo_material_url;

  this.canOperate = info.can_operate;

  this.trackingTool = info.tracking_tool;

  this.isFirstStageInProgress = () => {
    for (let i = 0; i < self.instances.length; i++) {
      if (self.instances[i].isFirstStageInProgress()) {
        return true;
      }
    }
    return false;
  };

  this.latestStage = () => {
    const lastInstance = _.last(this.instances);

    if (lastInstance) {
      return _.last(_.filter(lastInstance.stages, (s) => s.isBuildingOrCompleted()));
    }
  };

  this.triggerDisabled = Stream(false);
  if (!self.canOperate || self.isFirstStageInProgress() || self.isLocked || self.isPaused) {
    self.triggerDisabled(true);
  }

  function postURL(url, payload = {}) {
    return AjaxHelper.POST({url, apiVersion: 'v1', payload});
  }

  this.unpause = () => {
    return postURL(SparkRoutes.pipelineUnpausePath(self.name));
  };

  this.unlock = () => {
    return postURL(SparkRoutes.pipelineUnlockPath(self.name));
  };

  this.pause = (payload) => {
    return postURL(SparkRoutes.pipelinePausePath(self.name), payload);
  };

  this.trigger = (payload = {}) => {
    return postURL(SparkRoutes.pipelineTriggerPath(self.name), payload);
  };

  this.getInstanceCounters = () => {
    return _.map(this.instances, (instance) => instance.counter);
  };

  this.getDisabledTooltipText = () => {
    if (!self.canOperate) {
      return TooltipText.NO_OPERATE_PERMISSION;
    }
    if (self.isFirstStageInProgress()) {
      return TooltipText.FIRST_STAGE_IN_PROGRESS;
    }
    if (self.isPaused) {
      return TooltipText.PIPELINE_PAUSED;
    }
    if (self.isLocked) {
      return TooltipText.PIPELINE_LOCKED;
    }
  };

  this.getPauseDisabledTooltipText = () => {
    if (!self.canPause) {
      if (self.isPaused) {
        return TooltipText.NO_UNPAUSE_PERMISSION;
      }
      return TooltipText.NO_PAUSE_PERMISSION;
    }
  };

  this.getLockDisabledTooltipText = () => {
    return TooltipText.NO_UNLOCK_PERMISSION;
  };

  this.noEditPermissionTooltipText = () => {
    return TooltipText.NO_EDIT_PERMISSION;
  };

  const TooltipText = {
    NO_OPERATE_PERMISSION:   "您没有权限启动算法",
    PIPELINE_PAUSED:         "无法启动算法 - 算法当前被暂停.",
    PIPELINE_LOCKED:         "无法启动算法 - 算法当前被锁定.",
    FIRST_STAGE_IN_PROGRESS: "无法启动算法 - 第一阶段仍在处理中.",
    NO_EDIT_PERMISSION:      "您没有权限编辑算法.",
    NO_UNLOCK_PERMISSION:    "您没有权限解锁算法.",
    NO_PAUSE_PERMISSION:     "您没有权限暂停算法.",
    NO_UNPAUSE_PERMISSION:   "您没有权限恢复算法."
  };
};

