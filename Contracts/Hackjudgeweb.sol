// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


enum ConsensusType {
Majority,
Threshold
}

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

interface IWebsiteParseAgent {
function ExtractString(
string memory key,
string memory description,
string[] memory options,
string memory prompt,
string memory url,
bool resolveUrl,
uint8 numPages,
uint8 confidenceThreshold
) external returns (string memory);
}

contract WebsiteParser {

IAgentRequester public platform =
    IAgentRequester(
        0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776
    );

uint256 constant WEBSITE_AGENT_ID =
    12875401142070969085;

uint256 constant SUBCOMMITTEE_SIZE = 3;
uint256 constant COST_PER_AGENT = 0.1 ether;

struct WebsiteResult {
    string websiteUrl;
    string analysis;
    bool completed;
}

mapping(uint256 => WebsiteResult)
    public results;

mapping(uint256 => bool)
    public pendingRequests;

event WebsiteAnalysisRequested(
    uint256 indexed requestId,
    string websiteUrl
);

event WebsiteAnalysisCompleted(
    uint256 indexed requestId,
    string result
);

event WebsiteAnalysisFailed(
    uint256 indexed requestId,
    uint8 status
);

function getRequiredDeposit()
    public
    view
    returns(uint256)
{
    return
        platform.getRequestDeposit() +
        (COST_PER_AGENT * SUBCOMMITTEE_SIZE);
}

function analyzeWebsite(
    string calldata websiteUrl
)
    external
    payable
    returns(uint256 requestId)
{
    uint256 deposit =
        getRequiredDeposit();

    require(
        msg.value >= deposit,
        "Insufficient payment"
    );

    string[] memory options =
        new string[](0);

    bytes memory payload =
        abi.encodeWithSelector(
            IWebsiteParseAgent
                .ExtractString
                .selector,

            "website_analysis",

            "Website Analysis",

            options,

            "Extract Project Name, Description, Features, and Product Information.",

            websiteUrl,

            true,

            1,

            50
        );

    requestId =
        platform.createRequest{
            value: deposit
        }(
            WEBSITE_AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );

    results[requestId].websiteUrl =
        websiteUrl;

    pendingRequests[requestId] =
        true;

    emit WebsiteAnalysisRequested(
        requestId,
        websiteUrl
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

        results[requestId]
            .analysis =
                result;

        results[requestId]
            .completed =
                true;

        emit WebsiteAnalysisCompleted(
            requestId,
            result
        );
    } else {
        emit WebsiteAnalysisFailed(
            requestId,
            uint8(status)
        );
    }
}

function getAnalysis(
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
        results[requestId].analysis,
        results[requestId].completed
    );
}

receive() external payable {}
}
