const hre = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MyEpicGame", () => {
  // テストで使用するキャラクターの情報を定義
  const characters = [
    {
      name: "ZORO",
      imageURI: "QmW8sJXrdi2Rtambae9fVpGWuX15YJWBWuwz1D6jFvA5mr",
      hp: 100,
      maxHp: 100,
      attackDamage: 100,
    },
    {
      name: "NAMI",
      imageURI: "QmNz36YhahZ97zF5qRXxmJKKWUxo1ftCqXxVn9HcPMCqKE",
      hp: 50,
      maxHp: 50,
      attackDamage: 50,
    },
    {
      name: "USOPP",
      imageURI: "QmS3Amogb2dGHYABTTNDocLVQZ5FLiwiJEN8h6hzAEyynD",
      hp: 300,
      maxHp: 300,
      attackDamage: 25,
    },
  ];
  // テストで使用するボスの情報を定義
  const bigBoss = {
    name: "CROCODILE",
    imageURI: "https://i.imgur.com/BehawOh.png",
    hp: 100,
    maxHp: 100,
    attackDamage: 50,
  };

  async function deployTextFixture() {
    const gameContractFactory = await hre.ethers.getContractFactory(
      "MyEpicGame"
    );

    // Hardhat がローカルの Ethereum ネットワークを、コントラクトのためだけに作成
    const gameContract = await gameContractFactory.deploy(
      // キャラクターの名前
      [characters[0].name, characters[1].name, characters[2].name],
      // キャラクターの画像を IPFS の CID に変更
      [characters[0].imageURI, characters[1].imageURI, characters[2].imageURI],
      [characters[0].hp, characters[1].hp, characters[2].hp],
      [
        characters[0].attackDamage,
        characters[1].attackDamage,
        characters[2].attackDamage,
      ],
      bigBoss.name, // Bossの名前
      bigBoss.imageURI, // Bossの画像
      bigBoss.hp, // Bossのhp
      bigBoss.attackDamage // Bossの攻撃力
    );
    await gameContract.deployed();

    return {
      gameContract,
      characters,
      bigBoss,
    };
  }

  it("check if the characters are deployed correctly", async () => {
    const { gameContract, characters } = await loadFixture(deployTextFixture);

    const savedCharacters = await gameContract.getAllDefaultCharacters();

    // デプロイ時に指定したキャラクターの情報が保存されているかを確認
    expect(savedCharacters.length).to.equal(characters.length);

    for (let i = 0; i < savedCharacters.length; i++) {
      expect(savedCharacters[i].name).to.equal(characters[i].name);
      expect(savedCharacters[i].imageURI).to.equal(characters[i].imageURI);
      expect(savedCharacters[i].hp.toNumber()).to.equal(characters[i].hp);
      expect(savedCharacters[i].maxHp.toNumber()).to.equal(characters[i].maxHp);
      expect(savedCharacters[i].attackDamage.toNumber()).to.equal(
        characters[i].attackDamage
      );
    }
  });

  it("check if the big boss is deployed correctly", async () => {
    const { gameContract, bigBoss } = await loadFixture(deployTextFixture);

    const savedBigBoss = await gameContract.getBigBoss();

    // デプロイ時に指定したボスの情報が保存されているかを確認
    expect(savedBigBoss.name).to.equal(bigBoss.name);
    expect(savedBigBoss.imageURI).to.equal(bigBoss.imageURI);
    expect(savedBigBoss.hp.toNumber()).to.equal(bigBoss.hp);
    expect(savedBigBoss.maxHp.toNumber()).to.equal(bigBoss.maxHp);
    expect(savedBigBoss.attackDamage.toNumber()).to.equal(bigBoss.attackDamage);
  });

  it("attack was successful", async () => {
    const { gameContract } = await loadFixture(deployTextFixture);

    // 3体のNFTキャラクターの中から、3番目のキャラクターを Mint する
    let txn = await gameContract.mintCharacterNFT(2);

    // Minting が仮想マイナーにより、承認されるのを待つ
    await txn.wait();

    // mintしたNFTにおける、攻撃前と後のhpを取得する
    let hpBefore = 0;
    let hpAfter = 0;
    // NFTの情報を得る
    // かつきちんとMintがされているかを確認
    let NFTInfo = await gameContract.checkIfUserHasNFT();
    hpBefore = NFTInfo.hp.toNumber();

    // 1回目の攻撃: attackBoss 関数を追加
    txn = await gameContract.attackBoss();
    await txn.wait();

    NFTInfo = await gameContract.checkIfUserHasNFT();
    hpAfter = NFTInfo.hp.toNumber();

    expect(hpBefore - hpAfter).to.equal(50);
  });

  // ボスのHPがなくなった時に、ボスへの攻撃ができないことを確認
  it("check boss attack does not happen if boss hp is smaller than 0", async () => {
    const { gameContract } = await loadFixture(deployTextFixture);

    // 3体のNFTキャラクターの中から、1番目のキャラクターを Mint する
    let txn = await gameContract.mintCharacterNFT(0);

    // Minting が仮想マイナーにより、承認されるのを待つ
    await txn.wait();

    // 1回目の攻撃: attackBoss 関数を追加
    txn = await gameContract.attackBoss();
    await txn.wait();

    // 2回目の攻撃: attackBoss 関数を追加
    // ボスのhpがなくなった時に、エラーが発生することを確認
    expect(gameContract.attackBoss()).to.be.revertedWith(
      "Error: boss must have HP to attack characters."
    );
  });

  // キャラクターのHPがなくなった時に、ボスへの攻撃ができないことを確認
  it("check boss attack does not happen if character hp is smaller than 0", async () => {
    const { gameContract } = await loadFixture(deployTextFixture);

    // 3体のNFTキャラクターの中から、2番目のキャラクターを Mint する
    let txn = await gameContract.mintCharacterNFT(1);

    // Minting が仮想マイナーにより、承認されるのを待つ
    await txn.wait();

    // 1回目の攻撃: attackBoss 関数を追加
    txn = await gameContract.attackBoss();
    await txn.wait();

    // 2回目の攻撃: attackBoss 関数を追加
    // キャラクターのhpがなくなった時に、エラーが発生することを確認
    expect(gameContract.attackBoss()).to.be.revertedWith(
      "Error: character must have HP to attack boss."
    );
  });
});
