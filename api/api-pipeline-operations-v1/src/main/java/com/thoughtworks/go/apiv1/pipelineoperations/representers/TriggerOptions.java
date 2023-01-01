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
package com.thoughtworks.go.apiv1.pipelineoperations.representers;

import com.thoughtworks.go.config.EnvironmentVariablesConfig;
import com.thoughtworks.go.presentation.pipelinehistory.PipelineInstanceModel;

public class TriggerOptions {
    private final EnvironmentVariablesConfig variables;
    private final PipelineInstanceModel pipelineInstanceModel;

    public TriggerOptions(EnvironmentVariablesConfig variables, PipelineInstanceModel pipelineInstanceModel) {
        this.variables = variables;
        this.pipelineInstanceModel = pipelineInstanceModel;
    }

    public EnvironmentVariablesConfig getVariables() {
        return variables;
    }

    public PipelineInstanceModel getPipelineInstanceModel() {
        return pipelineInstanceModel;
    }
}
