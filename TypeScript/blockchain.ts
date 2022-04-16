import * as CryptoJS from "crypto-js";

class Block {
    static calculateBlockhash = (index: number, previousHash: string,
        timestamp: number, data: string): string =>
        CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

    static vaildateStructure = (aBlock: Block): boolean =>
        typeof aBlock.index === "number" &&
        typeof aBlock.hash === "string" &&
        typeof aBlock.previousHash === "string" &&
        typeof aBlock.timestamp === "number" &&
        typeof aBlock.data === "string";

    public index: number;
    public hash: string;
    public previousHash: string;
    public data: string;
    public timestamp: number;

    constructor(index: number,
        hash: string,
        previousHash: string,
        data: string,
        timestamp: number) {
        this.index = index;
        this.data = data;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
    }
}

const genesisBlock: Block = new Block(0, "hello", "20202020202020", "", 123456);

let blcokchian: Block[] = [genesisBlock];

const getBlockchain = (): Block[] => blcokchian;

const getLatestBlcok = (): Block => blcokchian[blcokchian.length - 1];

const getNewTimeStamp = (): number => Math.round(new Date().getTime() / 1000);

const createNewBlock = (data: string): Block => {
    const previousBlcok: Block = getLatestBlcok();
    const newIndex: number = previousBlcok.index + 1;
    const newTimestamp: number = getNewTimeStamp();
    const newHash: string = Block.calculateBlockhash(
        newIndex,
        previousBlcok.hash,
        newTimestamp,
        data
    );
    const newBlock: Block = new Block(
        newIndex,
        newHash,
        previousBlcok.hash,
        data,
        newTimestamp
    );
    addBlock(newBlock);
    return newBlock;
}

const getHashforBlock = (aBlock: Block): string => Block.calculateBlockhash(aBlock.index, aBlock.previousHash, aBlock.timestamp, aBlock.data);

const isBlcokVaild = (candiateBlcok: Block, previousBlcok: Block): boolean => {
    if (!Block.vaildateStructure(candiateBlcok)) {
        return false;
    }
    else if (previousBlcok.index + 1 !== candiateBlcok.index) {
        return false;
    }
    else if (previousBlcok.hash !== candiateBlcok.previousHash) {
        return false;
    }
    else if (getHashforBlock(candiateBlcok) !== candiateBlcok.hash) {
        return false;
    }
    else {
        return true;
    }
}

const addBlock = (candidateBlock: Block): void => {
    if (isBlcokVaild(candidateBlock, getLatestBlcok())) {
        blcokchian.push(candidateBlock);
    }
}

createNewBlock("second block");
createNewBlock("third block");
createNewBlock("4th block");

console.log(blcokchian);

export { };