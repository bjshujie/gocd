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
package com.thoughtworks.go.server.presentation.models;

import com.google.gson.Gson;
import com.thoughtworks.go.config.PipelineConfig;
import com.thoughtworks.go.domain.PipelinePauseInfo;
import com.thoughtworks.go.helper.PipelineConfigMother;
import com.thoughtworks.go.helper.PipelineHistoryMother;
import com.thoughtworks.go.helper.StageConfigMother;
import com.thoughtworks.go.presentation.pipelinehistory.PipelineInstanceModels;
import com.thoughtworks.go.server.presentation.PipelineHistoryGroupingUtil;
import com.thoughtworks.go.server.util.Pagination;
import com.thoughtworks.go.util.DateUtils;
import com.thoughtworks.go.util.GoConstants;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static com.thoughtworks.go.helper.PipelineConfigMother.createPipelineConfigWithStages;
import static net.javacrumbs.jsonunit.core.Option.IGNORING_EXTRA_FIELDS;
import static net.javacrumbs.jsonunit.fluent.JsonFluentAssert.assertThatJson;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

public class PipelineHistoryJsonPresentationModelTest {
    private PipelineConfig pipelineConfig;
    private PipelineHistoryJsonPresentationModel presenter;
    private static final int COUNT = 1;
    private static final int START = 1;
    private static final int PER_PAGE = 10;
    private static final boolean CAN_FORCE = false;
    private PipelinePauseInfo pipelinePauseInfo;
    private boolean hasForceBuildCause = false;
    private Date modificationDate = new Date();
    private boolean hasModification = false;

    @BeforeEach
    public void setUp() throws Exception {
        pipelineConfig = PipelineConfigMother.pipelineConfig("mingle", StageConfigMother.custom("dev", "defaultJob"),
            StageConfigMother.manualStage("ft"));
        pipelinePauseInfo = PipelinePauseInfo.notPaused();
        presenter = new PipelineHistoryJsonPresentationModel(pipelinePauseInfo,
            preparePipelineHistoryGroups(pipelineConfig),
            pipelineConfig,
            pagination(), CAN_FORCE, hasForceBuildCause, hasModification, true);
    }

    private Pagination pagination() {
        return Pagination.pageStartingAt(START, COUNT, PER_PAGE);
    }

    private PipelineHistoryGroups preparePipelineHistoryGroups(PipelineConfig pipelineConfig) {
        PipelineInstanceModels pipelineHistory = PipelineHistoryMother.pipelineHistory(pipelineConfig,
            modificationDate);
        return new PipelineHistoryGroupingUtil().createGroups(pipelineHistory);
    }

    private PipelineHistoryGroups preparePipelineHistoryGroupsWithErrorMessage(PipelineConfig pipelineConfig) {
        PipelineInstanceModels pipelineHistory = PipelineHistoryMother.pipelineHistoryWithErrorMessage(pipelineConfig,
            modificationDate);
        return new PipelineHistoryGroupingUtil().createGroups(pipelineHistory);
    }

    @AfterEach
    public void teardown() throws Exception {
        pipelinePauseInfo.setPaused(false);
    }

    @Test
    public void shouldContainPipelineConfig() {
        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
            "  \"groups\": [\n" +
            "    {\n" +
            "      \"config\": {\n" +
            "        \"stages\": [\n" +
            "          {\n" +
            "            \"name\": \"dev\",\n" +
            "            \"isAutoApproved\": \"true\"\n" +
            "          },\n" +
            "          {\n" +
            "            \"name\": \"ft\",\n" +
            "            \"isAutoApproved\": \"false\"\n" +
            "          }\n" +
            "        ]\n" +
            "      }\n" +
            "    }\n" +
            "  ]\n" +
            "}");
    }

    @Test
    public void shouldContainPipelineHistory() {
        Map json = presenter.toJson();
        assertThatJson(new Gson().toJson(json)).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
            "  \"groups\": [\n" +
            "    {\n" +
            "      \"history\": [\n" +
            "        {\n" +
            "          \"pipelineId\": 1,\n" +
            "          \"stages\": [\n" +
            "            {\n" +
            "              \"stageStatus\": \"Passed\",\n" +
            "              \"stageName\": \"dev\",\n" +
            "              \"stageId\": 0,\n" +
            "              \"approvedBy\": \"changes\",\n" +
            "              \"getCanRun\": \"false\",\n" +
            "              \"scheduled\": \"true\"\n" +
            "            },\n" +
            "            {\n" +
            "              \"stageStatus\": \"Passed\",\n" +
            "              \"stageName\": \"ft\",\n" +
            "              \"stageId\": 0,\n" +
            "              \"approvedBy\": \"lgao\",\n" +
            "              \"getCanRun\": \"false\",\n" +
            "              \"getCanCancel\": \"false\",\n" +
            "              \"scheduled\": \"true\"\n" +
            "            }\n" +
            "          ]\n" +
            "        }\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}");
    }

    @Test
    public void shouldContainPipelineHistoryWithErrorMessage() {
        presenter = new PipelineHistoryJsonPresentationModel(pipelinePauseInfo,
            preparePipelineHistoryGroupsWithErrorMessage(pipelineConfig),
            pipelineConfig,
            pagination(), CAN_FORCE, hasForceBuildCause, hasModification, true);
        Map json = presenter.toJson();
        assertThatJson(new Gson().toJson(json)).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
            "  \"groups\": [\n" +
            "    {\n" +
            "      \"history\": [\n" +
            "        {\n" +
            "          \"pipelineId\": 1,\n" +
            "          \"stages\": [\n" +
            "            {\n" +
            "              \"stageStatus\": \"Cancelled\",\n" +
            "              \"stageName\": \"dev\",\n" +
            "              \"stageId\": 0,\n" +
            "              \"approvedBy\": \"changes\",\n" +
            "              \"getCanRun\": \"true\",\n" +
            "              \"scheduled\": \"true\"\n" +
            "            },\n" +
            "            {\n" +
            "              \"stageStatus\": \"Unknown\",\n" +
            "              \"stageName\": \"ft\",\n" +
            "              \"stageId\": 0,\n" +
            "              \"approvedBy\": \"\",\n" +
            "              \"getCanRun\": \"false\",\n" +
            "              \"errorMessage\":\"Cannot schedule ft as the previous stage dev has Cancelled!\",\n" +
            "              \"getCanCancel\": \"false\",\n" +
            "              \"scheduled\": \"false\"\n" +
            "            }\n" +
            "          ]\n" +
            "        }\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}");
    }

    @Test
    public void shouldContainPipelineHistoryComments() {
        Map json = presenter.toJson();
        assertThatJson(new Gson().toJson(json))
            .when(IGNORING_EXTRA_FIELDS)
            .isEqualTo("{\n" +
                "  \"groups\": [\n" +
                "    {\n" +
                "      \"history\": [\n" +
                "        {\n" +
                "          \"pipelineId\": 1,\n" +
                "          \"comment\": \"build comment\"\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  ]\n" +
                "}");

    }

    @Test
    public void shouldContainPipelinePageInfo() {
        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
            "  \"pipelineName\": \"mingle\",\n" +
            "  \"count\": 1,\n" +
            "  \"canForce\": \"false\",\n" +
            "  \"start\": 1,\n" +
            "  \"perPage\": 10\n" +
            "}");
    }

    @Test
    public void needsApprovalInJsonShouldBeFalseWhenPipelineIsPaused() {
        pipelinePauseInfo.setPaused(true);
        HashMap<String, Object> map = new HashMap(presenter.toJson());

        assertThat(map.get("paused"), is("true"));
        assertThat(map, not(hasKey("needsApproval")));
    }

    @Test
    public void shouldShowFirstStageApproverNameInBuildCauseBy() {
        assertThatJson(presenter.toJson())
            .node("groups[0].history[0].buildCauseBy")
            .isEqualTo("Triggered by " + GoConstants.DEFAULT_APPROVED_BY);
    }

    @Test
    public void shouldContainMaterialRevisions() {
        assertThatJson(presenter.toJson())
            .node("groups[0].history[0].materialRevisions[0].revision").isEqualTo("svn.100")
            .node("groups[0].history[0].materialRevisions[0].user").isEqualTo("user")
            .node("groups[0].history[0].materialRevisions[0].date").isEqualTo(DateUtils.formatISO8601(modificationDate));
    }

    @Test
    public void shouldContainPipelineCounterOrLabel() {
        assertThatJson(presenter.toJson())
            .node("groups[0].history[0].counterOrLabel").isStringEqualTo("1");
    }

    @Test
    public void shouldContainPipelinePauseInfo() {
        pipelinePauseInfo.setPaused(true);
        pipelinePauseInfo.setPauseCause("pauseCause");
        pipelinePauseInfo.setPauseBy("pauseBy");

        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
                "  \"paused\": \"true\"\n" +
                "}");
        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
                "  \"pauseCause\": \"pauseCause\"\n" +
                "}");
        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
                "  \"pauseBy\": \"pauseBy\"\n" +
                "}");
    }

    @Test
    public void shouldCreateGroupForCurrentConfigIfItHasChanged() {
        PipelineHistoryGroups historyGroups = preparePipelineHistoryGroups(pipelineConfig);
        PipelineConfig newConfig = createPipelineConfigWithStages("mingle", "stage1", "stage2");
        presenter = new PipelineHistoryJsonPresentationModel(pipelinePauseInfo,
                historyGroups,
                newConfig,
                pagination(), CAN_FORCE, hasForceBuildCause, hasModification, true);
        assertThatJson(new Gson().toJson(presenter.toJson())).when(IGNORING_EXTRA_FIELDS).isEqualTo("{\n" +
                "  \"groups\": [\n" +
                "    {\n" +
                "      \"config\": {\n" +
                "        \"stages\": [\n" +
                "          {\n" +
                "            \"name\": \"stage1\",\n" +
                "            \"isAutoApproved\": \"true\"\n" +
                "          },\n" +
                "          {\n" +
                "            \"name\": \"stage2\",\n" +
                "            \"isAutoApproved\": \"true\"\n" +
                "          }\n" +
                "        ]\n" +
                "      }\n" +
                "    },\n" +
                "    {\n" +
                "      \"config\": {\n" +
                "        \"stages\": [\n" +
                "          {\n" +
                "            \"name\": \"dev\",\n" +
                "            \"isAutoApproved\": \"true\"\n" +
                "          },\n" +
                "          {\n" +
                "            \"name\": \"ft\",\n" +
                "            \"isAutoApproved\": \"false\"\n" +
                "          }\n" +
                "        ]\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}");
    }

    @Test
    public void shouldEncodeStageLocator() {
        PipelineConfig pipelineConfig1 = createPipelineConfigWithStages("mingle-%", "stage1-%",
                "stage2");
        PipelineHistoryJsonPresentationModel presenter = new PipelineHistoryJsonPresentationModel(pipelinePauseInfo,
                preparePipelineHistoryGroups(pipelineConfig1),
                pipelineConfig1,
                pagination(), CAN_FORCE, hasForceBuildCause, hasModification, true);
        assertThatJson(presenter.toJson())
            .node("groups[0].history[0].stages[0].stageLocator").isEqualTo("mingle-%25/1/stage1-%25/1");
    }

    @Test
    public void shouldGetScheduleTimestamp() {
        PipelineConfig pipelineConfig1 = createPipelineConfigWithStages("mingle-%", "stage1-%",
                "stage2");
        PipelineHistoryJsonPresentationModel presenter = new PipelineHistoryJsonPresentationModel(pipelinePauseInfo,
                preparePipelineHistoryGroups(pipelineConfig1),
                pipelineConfig1,
                pagination(), CAN_FORCE, hasForceBuildCause, hasModification, true);
        assertThatJson(presenter.toJson())
            .node("groups[0].history[0].scheduled_timestamp").isEqualTo(modificationDate.getTime());
    }

}
