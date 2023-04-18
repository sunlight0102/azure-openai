import { useRef, useState, useEffect } from "react";
import { Panel, DefaultButton, Spinner, SpinButton, Stack } from "@fluentui/react";

import styles from "./SqlAgent.module.css";
import { IStyleSet, ILabelStyles, IPivotItemProps, Pivot, PivotItem } from '@fluentui/react';
import { SparkleFilled, BarcodeScanner24Filled } from "@fluentui/react-icons";

import { sqlChat, AskResponse, sqlChain, getSpeechApi } from "../../api";
import { Answer, AnswerError } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { ExampleList, ExampleModel } from "../../components/Example";
import { SettingsButton } from "../../components/SettingsButton/SettingsButton";
import { ClearChatButton } from "../../components/ClearChatButton";
var audio = new Audio();

const SqlAgent = () => {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [promptTemplatePrefix, setPromptTemplatePrefix] = useState<string>("");
    const [promptTemplateSuffix, setPromptTemplateSuffix] = useState<string>("");
    const [retrieveCount, setRetrieveCount] = useState<number>(10);
    const [temperature, setTemperature] = useState<number>(0.3);
    const [tokenLength, setTokenLength] = useState<number>(500);

    const [activeCitation, setActiveCitation] = useState<string>();

    const lastQuestionRef = useRef<string>("");
    const lastQuestionChainRef = useRef<string>("");
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();
    //const [answer, setAnswer] = useState<AskResponse>();
    const [answer, setAnswer] = useState<[AskResponse, string | null]>();
    const [errorChain, setErrorChain] = useState<unknown>();
    //const [answerChain, setAnswerChain] = useState<AskResponse>();
    const [answerChain, setAnswerChain] = useState<[AskResponse, string | null]>();
    const [useAutoSpeakAnswers, setUseAutoSpeakAnswers] = useState<boolean>(false);


    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [exampleList, setExampleList] = useState<ExampleModel[]>([{text:'', value: ''}]);
    const [summary, setSummary] = useState<string>();
    const [qa, setQa] = useState<string>('');
    const [exampleLoading, setExampleLoading] = useState(false)


    const startSynthesis = (url: string | null) => {
        if(isSpeaking) {
            audio.pause();
            setIsSpeaking(false);
        }

        if(url === null) {
            return;
        }

        audio = new Audio(url);
        audio.play();
        setIsSpeaking(true);
        audio.addEventListener('ended', () => {
            setIsSpeaking(false);
        });
    };

    const stopSynthesis = () => {
        audio.pause();
        setIsSpeaking(false);
    };

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const result = await sqlChat(question, retrieveCount);
            //setAnswer(result);
            const speechUrl = await getSpeechApi(result.answer);
            setAnswer([result, speechUrl]);
            if(useAutoSpeakAnswers) {
                startSynthesis(speechUrl);
            }

            if (result.error) {
                setError(result.error);
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const makeApiChainRequest = async (question: string) => {
        lastQuestionChainRef.current = question;

        errorChain && setErrorChain(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const result = await sqlChain(question, retrieveCount);
            //setAnswerChain(result);
            const speechUrl = await getSpeechApi(result.answer);
            setAnswerChain([result, speechUrl]);
            if(useAutoSpeakAnswers) {
                startSynthesis(speechUrl);
            }
            if (result.error) {
                setErrorChain(result.error);
            }
        } catch (e) {
            setErrorChain(e);
        } finally {
            setIsLoading(false);
        }
    };

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onPromptTemplatePrefixChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplatePrefix(newValue || "");
    };

    const onPromptTemplateSuffixChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplateSuffix(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onTemperatureChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setTemperature(parseInt(newValue || "0.3"));
    };

    const onTokenLengthChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setTokenLength(parseInt(newValue || "500"));
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
    };

    const onExampleChainClicked = (example: string) => {
        makeApiChainRequest(example);
    };

    const onToggleTab = (tab: AnalysisPanelTabs) => {
        if (activeAnalysisPanelTab === tab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }
    };

    const onShowCitation = (citation: string) => {
    };

    const documentSummaryAndQa = async () => {
        const sampleQuestion = []
        const  questionList = [] 
        questionList.push("What products are available")
        questionList.push("Which shippers can ship the orders?")
        questionList.push("How many shipment Speedy Express did?")
        questionList.push("How many customers did placed an order")
        questionList.push("For the year 1996 give me subtotals for each order")
        questionList.push("Show me the Sales by Year")
        questionList.push("Which employee did largest order")
        questionList.push("get an alphabetical list of products.")
        questionList.push("List the discontinued products")
        questionList.push("calculates sales price for each order after discount is applied")
        questionList.push("Show top 10 Products by Category")
        questionList.push("Display Products by Category")
        questionList.push("Top 10 Customer and Suppliers by City")
        questionList.push("List of the Products that are above average price")
        questionList.push("List of the Products that are above average price, also show average price for each product")
        questionList.push("Number of units in stock by category and supplier continent")

        const shuffled = questionList.sort(() => 0.5 - Math.random());
        const selectedQuestion = shuffled.slice(0, 5);

        for (const item of selectedQuestion) {
            if ((item != '')) {
                sampleQuestion.push({
                    text: item,
                    value: item,
                })
            } 
        }
        const generatedExamples: ExampleModel[] = sampleQuestion
        setExampleList(generatedExamples)
        setExampleLoading(false)

        const summary = "This use-case showcases how using the prompt engineering approach from Chain of Thought modelling we can make "
        + " it scalable and further use LLM's capability of generating SQL Code from Natural Language by providing the context  "
        + " without the need to know the DB schema before hand.  "
        + " For this use-case we are using the Northwind sample database (https://github.com/microsoft/sql-server-samples/tree/master/samples/databases/northwind-pubs) "
        + " that is hosted in Azure SQL, but you can easily change it to instead use Synapse (Dedicated or Serverless) to query against the data in Lakehouse."
        + " Ask the question based on the ERD of Northwind Sample database at https://en.wikiversity.org/wiki/Database_Examples/Northwind"
        setSummary(summary)

    }

    const clearChat = () => {
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswer(undefined);
    };

    const clearChainChat = () => {
        lastQuestionChainRef.current = "";
        errorChain && setErrorChain(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswerChain(undefined);
    };

    useEffect(() => {
        documentSummaryAndQa()
    }, [])

    return (
        <div className={styles.root}>
            <div className={styles.oneshotContainer}>
            <Pivot aria-label="Chat">
                    <PivotItem
                        headerText="Agent"
                        headerButtonProps={{
                        'data-order': 1,
                        }}
                    >
                    <div className={styles.oneshotTopSection}>
                        <div className={styles.commandsContainer}>
                            <ClearChatButton className={styles.settingsButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
                            <SettingsButton className={styles.settingsButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
                        </div>
                        <SparkleFilled fontSize={"30px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" />
                        <h1 className={styles.oneshotTitle}>Ask your SQL</h1>
                        <div className={styles.example}>
                            <p className={styles.exampleText}><b>Scenario</b> : {summary}</p>
                        </div>
                        <h4 className={styles.chatEmptyStateSubtitle}>Ask anything or try from following example</h4>
                        <div className={styles.oneshotQuestionInput}>
                            <QuestionInput
                                placeholder="Ask me anything"
                                disabled={isLoading}
                                onSend={question => makeApiRequest(question)}
                            />
                        </div>
                        {exampleLoading ? <div><span>Please wait, Generating Sample Question</span><Spinner/></div> : null}
                        {/* {!answer && (
                            <ExampleList onExampleClicked={onExampleClicked}
                            EXAMPLES={
                                exampleList
                            } />
                        )} */}
                        <ExampleList onExampleClicked={onExampleClicked}
                            EXAMPLES={
                                exampleList
                        } />
                    </div>
                    <div className={styles.oneshotBottomSection}>
                        {isLoading && <Spinner label="Generating answer" />}
                        {!isLoading && answer && !error && (
                            <div>
                                <div className={styles.oneshotAnswerContainer}>
                                    <Stack horizontal horizontalAlign="space-between">
                                        <Answer
                                            //answer={answer}
                                            answer={answer[0]}
                                            isSpeaking = {isSpeaking}
                                            onCitationClicked={x => onShowCitation(x)}
                                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab)}
                                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab)}
                                            onSpeechSynthesisClicked={() => isSpeaking? stopSynthesis(): startSynthesis(answer[1])}
                                        />
                                    </Stack>                               
                                </div>
                            </div>
                        )}
                        {error ? (
                            <div className={styles.oneshotAnswerContainer}>
                                <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                            </div>
                        ) : null}
                        {activeAnalysisPanelTab && answer && (
                            <AnalysisPanel
                                className={styles.oneshotAnalysisPanel}
                                activeCitation={activeCitation}
                                onActiveTabChanged={x => onToggleTab(x)}
                                citationHeight="600px"
                                //answer={answer}
                                answer={answer[0]}
                                activeTab={activeAnalysisPanelTab}
                            />
                        )}
                    </div>
                    </PivotItem>
                    <PivotItem
                        headerText="Database Chain"
                        headerButtonProps={{
                        'data-order': 2,
                        }}
                    >
                        <div className={styles.oneshotTopSection}>
                            <div className={styles.commandsContainer}>
                                <ClearChatButton className={styles.settingsButton} onClick={clearChainChat} disabled={!lastQuestionChainRef.current || isLoading} />
                                <SettingsButton className={styles.settingsButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
                            </div>
                            <SparkleFilled fontSize={"30px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" />
                            <h1 className={styles.oneshotTitle}>Ask your SQL</h1>
                            <div className={styles.example}>
                                <p className={styles.exampleText}><b>Scenario</b> : {summary}</p>
                            </div>
                            <h4 className={styles.chatEmptyStateSubtitle}>Ask anything or try from following example</h4>
                            <div className={styles.oneshotQuestionInput}>
                                <QuestionInput
                                    placeholder="Ask me anything"
                                    disabled={isLoading}
                                    onSend={question => makeApiChainRequest(question)}
                                />
                            </div>
                            {exampleLoading ? <div><span>Please wait, Generating Sample Question</span><Spinner/></div> : null}
                            {/* {!answerChain && (
                                <ExampleList onExampleClicked={onExampleChainClicked}
                                EXAMPLES={
                                    exampleList
                                } />
                            )}
                             */}
                            <ExampleList onExampleClicked={onExampleChainClicked}
                                EXAMPLES={
                                    exampleList
                                } />
                        </div>
                        <div className={styles.oneshotBottomSection}>
                            {isLoading && <Spinner label="Generating answer" />}
                            {!isLoading && answerChain && !errorChain && (
                                <div>
                                    <div className={styles.oneshotAnswerContainer}>
                                        <Stack horizontal horizontalAlign="space-between">
                                            <Answer
                                                //answer={answerChain}
                                                answer={answerChain[0]}
                                                isSpeaking = {isSpeaking}
                                                onCitationClicked={x => onShowCitation(x)}
                                                onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab)}
                                                onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab)}
                                                onSpeechSynthesisClicked={() => isSpeaking? stopSynthesis(): startSynthesis(answerChain[1])}
                                            />
                                        </Stack>                               
                                    </div>
                                </div>
                            )}
                            {errorChain ? (
                                <div className={styles.oneshotAnswerContainer}>
                                    <AnswerError error={errorChain.toString()} onRetry={() => makeApiChainRequest(lastQuestionChainRef.current)} />
                                </div>
                            ) : null}
                            {activeAnalysisPanelTab && answerChain && (
                                <AnalysisPanel
                                    className={styles.oneshotAnalysisPanel}
                                    activeCitation={activeCitation}
                                    onActiveTabChanged={x => onToggleTab(x)}
                                    citationHeight="600px"
                                    //answer={answerChain}
                                    answer={answerChain[0]}
                                    activeTab={activeAnalysisPanelTab}
                                />
                            )}
                        </div>
                    </PivotItem>
                </Pivot>
                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <br/>
                    <SpinButton
                        className={styles.oneshotSettingsSeparator}
                        label="Retrieve this many documents from search:"
                        min={1}
                        max={100}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <SpinButton
                        className={styles.oneshotSettingsSeparator}
                        label="Set the Temperature:"
                        min={0.0}
                        max={1.0}
                        defaultValue={temperature.toString()}
                        onChange={onTemperatureChange}
                    />
                    <SpinButton
                        className={styles.oneshotSettingsSeparator}
                        label="Max Length (Tokens):"
                        min={0}
                        max={4000}
                        defaultValue={tokenLength.toString()}
                        onChange={onTokenLengthChange}
                    />
                </Panel>
            </div>
        </div>
    );
};

export default SqlAgent;

