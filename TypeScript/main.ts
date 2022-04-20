import * as crypto from "crypto-js";

class Block {
    static index = 0;
    private key = 0;
    public hash: string;
    private timestamp: any;
    private data: string;
    public previousHash = '';

    constructor(private message) {
        Block.index += Block.index;
        this.timestamp = Date.now();
        this.data = 
            Block.index
            + this.timestamp
            + this.message
            + this.previousHash;
    };

    createHash = () => {
        return crypto.HmacSHA256(this.data, this.key.toString()).toString();
    };

    mining = (zeroes) => {
        while(this.hash.toString().substring(0, zeroes) !== Array(zeroes + 1).join("0")) {
            this.key++;
            this.hash = this.createHash();
        }
        console.log(`${this.hash.toString()} :: ${this.data}, ${this.key}`);
    };
};

class BlockChain {
    public chain: Array<Block> = [];
    constructor() { };
    static previousHash = '';

    addBlock = (block: Block) => {
        block.previousHash = BlockChain.previousHash;
        block.hash = block.createHash();
        BlockChain.previousHash = block.hash;

        this.chain.push(block);
    };

    isValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log(`[${previousBlock.hash.toString()}]->[${currentBlock.previousHash.toString()}]`);
                console.log(`Fault Block`);
            // } else {
                // console.log(`Normal Block`);
            }
        }
    };
};

const main = () => {
    const genesysBlock = new Block(`산모와 신생아의 마이크로바이옴 빅데이터 구축과 인공지능을 활용하는 진단 시스템 개발`);
    genesysBlock.previousHash = crypto.HmacSHA256('', '1').toString();
    // console.log(genesysBlock);
    // console.log(genesysBlock.createHash().toString());

    const tinyChain = new BlockChain();
    tinyChain.addBlock(genesysBlock);
    // console.log(tinyChain.chain);
    // console.log(`[${tinyChain.chain[0].previousHash.toString()}]->[${tinyChain.chain[0].hash.toString()}]`);

    const secondBlock = new Block(`두번째 블록입니다. 산모가 신생아에게 푸조의 위험성을 전달하였습니다.`);
    tinyChain.addBlock(secondBlock);
    tinyChain.chain[1].hash = `1f30adee6fb65aa5de46a58fbc51c98abd26c225b07c1532a04d4d0948905075`; // 해킹시도
    const thirdBlock = new Block(`세번째 블록입니다. 신생아가 친구에게 AiB 유산균을 추천하였습니다.`);
    tinyChain.addBlock(thirdBlock);

    tinyChain.isValid();
    // thirdBlock.mining(4);
}

const startTime = Date.now();
console.log(`Start :: ${startTime}`);
main();
const endTime = Date.now();
console.log(`End :: ${endTime} [ Processing Time :: ${(endTime - startTime) / 1000} sec ]`); // milliseconds