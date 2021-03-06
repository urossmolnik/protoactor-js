import { IMailbox } from "./mailbox";
import { PID } from "./pid";
import { IProcess } from "./process";
import * as messages from "./messages";

export class LocalProcess implements IProcess {
    public IsDead:boolean
    constructor(private Mailbox: IMailbox) {

    }

    SendUserMessage(pid: PID, message: string, sender?: PID) {
        if (sender) {
            this.Mailbox.PostUserMessage(new messages.MessageSender(message, sender))
        }
        this.Mailbox.PostUserMessage(message)
    }

    SendSystemMessage(pid: PID, message: messages.Message) {
        this.Mailbox.PostSystemMessage(message)
    }

    Stop(pid: PID) {
        this.SendSystemMessage(pid, messages.Stop.Instance)
    }
}