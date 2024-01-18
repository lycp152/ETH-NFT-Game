const main = async () => {
  const gameContractFactory = await hre.ethers.getContractFactory("MyEpicGame");
  const gameContract = await gameContractFactory.deploy(
    ["ZORO", "NAMI", "USOPP"], // キャラクターの名前
    [
      "https://i.imgur.com/TZEhCTX.png", // キャラクターの画像
      "https://i.imgur.com/WVAaMPA.png",
      "https://i.imgur.com/pCMZeiM.png",
    ],
    [100, 200, 300], // キャラクターのHP
    [100, 50, 25] // キャラクターの攻撃力
  );
  await gameContract.deployed();
  console.log("Contract deployed to:", gameContract.address);

  // 再代入可能な変数 txn を宣言
  let txn;
  // 3体のNFTキャラクターの中から、3番目のキャラクターを Mint しています。
  txn = await gameContract.mintCharacterNFT(2);

  // Minting が仮想マイナーにより、承認されるのを待ちます。
  await txn.wait();

  // NFTのURIの値を取得します。tokenURI は ERC721 から継承した関数です。
  let returnedTokenUri = await gameContract.tokenURI(1);
  console.log("Token URI:", returnedTokenUri);
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
