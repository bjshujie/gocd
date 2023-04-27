#
# Copyright 2023 Thoughtworks, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

class Admin::ConfigurationController < AdminController
  before_action :fetch_config , :only => [:show, :edit]
  before_action :tab_name, :page_title

  def show
    fetch_cruise_config_revision @go_config.md5
  end

  def edit
    fetch_cruise_config_revision @go_config.md5
  end

  def update
    result = HttpLocalizedOperationResult.new
    config_validity = admin_service.updateConfig(params[:go_config], result)
    unless config_validity.isValid()
      flash.now[:error] = '保存失败，请查看以下错误'
      @errors = [config_validity.errorMessage()]
      fetch_config
      if switch_to_split_pane?(config_validity)
        flash.now[:error] = '其它人修改了配置，与您的更改存在冲突。请复查、修改并重试.'
        @flash_help_link = "<a class='' href='#{CurrentGoCDVersion.docs_url('configuration/configuration_reference.html')}' target='_blank'>帮助主题：配置</a>"
        @conflicted_config = GoConfig.new(params[:go_config])
        fetch_cruise_config_revision @go_config.md5
        @render_config_via_ajax = true
        render :split_pane and return
      else
        @go_config = GoConfig.new(params[:go_config].merge(:location => @go_config.location))
        fetch_cruise_config_revision @go_config.md5
        @render_config_via_ajax = false
        render :edit and return
      end
    end
    flash[:success] = config_validity.wasMerged() ? "保存成功. 配置已被其他人修改，但您的更改已成功合并." : '保存成功.'
    redirect_to config_view_path
  end

  private
  def fetch_config
    config = go_config_service.getConfigAtVersion('current')
    @go_config = GoConfig.new({location: go_config_service.fileLocation, md5: config.getMd5, content: config.getContent})
  end

  def fetch_cruise_config_revision md5
    @go_config_revision = config_repository.getRevision(md5)
  end

  def switch_to_split_pane? config_validity
    !config_validity.isValid() && (config_validity.isMergeConflict() || config_validity.isPostValidationError())
  end

  def tab_name
    @tab_name = 'configuration-xml'
  end

  def page_title
    @view_title = 'Administration'
  end
end

