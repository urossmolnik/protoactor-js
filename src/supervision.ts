import { RestartStatistics } from "./restartStatistics";
import { PID } from "./pid";

export enum SupervisorDirective {
    Resume = 0,
    Restart = 1,
    Stop = 2,
    Escalate = 3
}
export interface IStrategy {
    HandleFailure(supervisor: ISupervisor, child: PID, restartStatistics: RestartStatistics, reason: any): void;
}
export class OneForOneStrategy implements IStrategy {
    constructor(private decider: IDecider, private maxRetries: number, private withinMs = 0) {

    }

    HandleFailure(supervisor: ISupervisor, child: PID, restartStatistics: RestartStatistics, reason: any) {
        let directive = this.decider(reason, child)
        switch (directive) {
            case SupervisorDirective.Resume:
                supervisor.ResumeChildren(child);
                break;
            case SupervisorDirective.Restart:
                if (this.requestRestartPermission(restartStatistics)) {
                    global.console.log('Restarting', child.ToShortString(), 'Reason', reason)
                    supervisor.RestartChildren(child)
                } else {
                    global.console.log('Stopping', child.ToShortString(), 'Reason', reason)
                    supervisor.StopChildren(child)
                }
                break
            case SupervisorDirective.Stop:
                global.console.log('Stopping', child.ToShortString(), 'Reason', reason)
                supervisor.StopChildren(child)
                break
            case SupervisorDirective.Escalate:
                supervisor.EscalateFailure(reason, child)
                break
        }
    }

    private requestRestartPermission(restartStatistics: RestartStatistics) {
        if (this.maxRetries == 0) {
            return false
        }
        restartStatistics.Fail()
        if (this.withinMs == 0 || restartStatistics.IsWithinDuration(this.withinMs)) {
            return restartStatistics.FailureCount <= this.maxRetries
        }
        restartStatistics.Reset()
        return true
    }
}

const defaultDecider: IDecider = () => SupervisorDirective.Restart

export const DefaultStrategy = new OneForOneStrategy(defaultDecider, 10, 10 * 1000)

export interface IDecider {
    (reason: any, who: PID): SupervisorDirective
}

export interface ISupervisor {
    ResumeChildren(child: PID): void;
    RestartChildren(child: PID): void;
    StopChildren(child: PID): void;
    EscalateFailure(error: any, child?: PID): void;
}


