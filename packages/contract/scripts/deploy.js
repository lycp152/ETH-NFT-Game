const main = async () => {
  // これにより、`MyEpicGame` コントラクトがコンパイルされます。
  // コントラクトがコンパイルされたら、コントラクトを扱うために必要なファイルが
  // `artifacts` ディレクトリの直下に生成されます。
  const gameContractFactory = await hre.ethers.getContractFactory("MyEpicGame");
  // Hardhat がローカルの Ethereum ネットワークを、コントラクトのためだけに作成します。
  const gameContract = await gameContractFactory.deploy(
    ["ZORO", "NAMI", "USOPP"], // キャラクターの名前
    [
      "https://i.imgur.com/TZEhCTX.png", // キャラクターの画像
      "https://i.imgur.com/WVAaMPA.png",
      "https://i.imgur.com/pCMZeiM.png",
    ],
    [100, 200, 300],
    [100, 50, 25],
    "CROCODILE", // Bossの名前
    "https://i.imgur.com/BehawOh.png", // Bossの画像
    10000, // Bossのhp
    50 // Bossの攻撃力
  );
  // ここでは、nftGame コントラクトが、
  // ローカルのブロックチェーンにデプロイされるまで待つ処理を行っています。
  const nftGame = await gameContract.deployed();

  console.log("Contract deployed to:", nftGame.address);
  let txn;
  // 3体のNFTキャラクターの中から、3番目のキャラクターを Mint しています。
  txn = await gameContract.mintCharacterNFT(2);

  // Minting が仮想マイナーにより、承認されるのを待ちます。
  await txn.wait();
  txn = await gameContract.attackBoss();
  await txn.wait();
  console.log("First attack.");
  txn = await gameContract.attackBoss();
  await txn.wait();
  console.log("Second attack.");

  console.log("Done!");
};
const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
runMain();
