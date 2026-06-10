// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum ConsensusType { Majority, Threshold }

enum ResponseStatus {
    None,
    Pending,
    Success,
    Failed,
    TimedOut
}

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
    uint256 perAgentBudget;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256);

    function getRequestDeposit()
        external
        view
        returns (uint256);
}

interface ILLMAgent {
    function inferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external returns (string memory);
}

contract HackJudgeLLM {

    IAgentRequester public platform =
        IAgentRequester(
            0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776
        );

    uint256 constant LLM_AGENT_ID =
        12847293847561029384;

    uint256 constant SUBCOMMITTEE_SIZE = 3;

    uint256 constant LLM_COST_PER_AGENT =
        0.10 ether;

    struct ScoreResult {
        string result;
        bool completed;
    }

    mapping(uint256 => ScoreResult)
        public scores;

    mapping(uint256 => bool)
        public pendingRequests;

    event EvaluationRequested(
        uint256 indexed requestId
    );

    event EvaluationCompleted(
        uint256 indexed requestId,
        string result
    );

    function analyzeProject(
        string calldata theme,
        string calldata projectAnalysis
    )
        external
        payable
        returns(uint256 requestId)
    {
        string memory prompt =
            string(
                abi.encodePacked(
                    "Hackathon Theme: ",
                    theme,
                    "\n\nProject Analysis:\n",
                    projectAnalysis,
                    "\n\nEvaluate this project and return:\n",
                    "Project Name\n",
                    "Theme Relevance Score (0-100)\n",
                    "Innovation Score (0-100)\n",
                    "Technical Complexity Score (0-100)\n",
                    "Real World Impact Score (0-100)\n",
                    "Overall Score (0-100)\n",
                    "Verdict\n",
                    "Reason"
                )
            );

        string[] memory allowed =
            new string[](0);

        bytes memory payload =
            abi.encodeWithSelector(
                ILLMAgent.inferString.selector,
                prompt,
                "You are an expert hackathon judge.",
                false,
                allowed
            );

        uint256 reserve =
            platform.getRequestDeposit();

        uint256 reward =
            LLM_COST_PER_AGENT *
            SUBCOMMITTEE_SIZE;

        uint256 deposit =
            reserve + reward;

        require(
            msg.value >= deposit,
            "Insufficient payment"
        );

        requestId =
            platform.createRequest{
                value: msg.value
            }(
                LLM_AGENT_ID,
                address(this),
                this.handleResponse.selector,
                payload
            );

        pendingRequests[requestId] = true;

        emit EvaluationRequested(
            requestId
        );
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    )
        external
    {
        require(
            msg.sender ==
            address(platform),
            "Only platform"
        );

        require(
            pendingRequests[requestId],
            "Unknown request"
        );

        delete pendingRequests[
            requestId
        ];

        if (
            status ==
            ResponseStatus.Success &&
            responses.length > 0
        ) {

            string memory result =
                abi.decode(
                    responses[0].result,
                    (string)
                );

            scores[requestId] =
                ScoreResult({
                    result: result,
                    completed: true
                });

            emit EvaluationCompleted(
                requestId,
                result
            );
        }
    }

    function getScore(
        uint256 requestId
    )
        external
        view
        returns(
            string memory,
            bool
        )
    {
        return (
            scores[requestId].result,
            scores[requestId].completed
        );
    }

    function getRequiredDeposit()
        external
        view
        returns(uint256)
    {
        uint256 reserve =
            platform.getRequestDeposit();

        uint256 reward =
            LLM_COST_PER_AGENT *
            SUBCOMMITTEE_SIZE;

        return reserve + reward;
    }

    receive() external payable {}
}