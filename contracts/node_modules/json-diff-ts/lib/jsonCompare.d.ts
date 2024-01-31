import { IFlatChange, Operation } from './jsonDiff';
export declare enum CompareOperation {
    CONTAINER = "CONTAINER",
    UNCHANGED = "UNCHANGED"
}
export interface IComparisonEnrichedNode {
    type: Operation | CompareOperation;
    value: IComparisonEnrichedNode | IComparisonEnrichedNode[] | any | any[];
    oldValue?: any;
}
export declare const createValue: (value: any) => IComparisonEnrichedNode;
export declare const createContainer: (value: object | []) => IComparisonEnrichedNode;
export declare const enrich: (object: any) => IComparisonEnrichedNode;
export declare const applyChangelist: (object: IComparisonEnrichedNode, changelist: IFlatChange[]) => IComparisonEnrichedNode;
export declare const compare: (oldObject: any, newObject: any) => IComparisonEnrichedNode;
