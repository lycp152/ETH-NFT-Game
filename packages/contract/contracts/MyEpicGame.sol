// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// NFT発行のコントラクト ERC721.sol をインポートします。
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

//OpenZeppelinが提供するヘルパー機能をインポートします。
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

import "./libraries/Base64.sol";

// MyEpicGameコントラクトは、NFTの標準規格であるERC721を継承します。
contract MyEpicGame is ERC721 {

  struct CharacterAttributes {
    uint characterIndex;
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  // tokenIdはNFTの一意な識別子で、0, 1, 2, .. N のように付与されます。
  uint256 private _tokenIds;

  // キャラクターのデフォルトデータを保持するための配列 defaultCharacters を作成します。それぞれの配列は、CharacterAttributes 型です。
  CharacterAttributes[] defaultCharacters;

  // NFTの tokenId と CharacterAttributes を紐づける mapping を作成します。
  mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

  // ユーザーのアドレスと NFT の tokenId を紐づける mapping を作成しています。
  mapping(address => uint256) public nftHolders;

  constructor(
  // プレイヤーが新しく NFT キャラクターを Mint する際に、キャラクターを初期化するために渡されるデータを設定しています。これらの値は フロントエンド（js ファイル）から渡されます。
    string[] memory characterNames,
    string[] memory characterImageURIs,
    uint[] memory characterHp,
    uint[] memory characterAttackDmg
  )
    // 作成するNFTの名前とそのシンボルをERC721規格に渡しています。
    ERC721("OnePiece", "ONEPIECE")
  {
  // ゲームで扱う全てのキャラクターをループ処理で呼び出し、それぞれのキャラクターに付与されるデフォルト値をコントラクトに保存します。
  // 後でNFTを作成する際に使用します。
    for(uint i = 0; i < characterNames.length; i += 1) {
      defaultCharacters.push(CharacterAttributes({
        characterIndex: i,
        name: characterNames[i],
        imageURI: characterImageURIs[i],
        hp: characterHp[i],
        maxHp: characterHp[i],
        attackDamage: characterAttackDmg[i]
      }));

      CharacterAttributes memory character = defaultCharacters[i];

    //  ハードハットのconsole.log()では、任意の順番で最大4つのパラメータを指定できます。
	  // 使用できるパラメータの種類: uint, string, bool, address
      console.log("Done initializing %s w/ HP %s, img %s", character.name, character.hp, character.imageURI);
    }

    // 次の NFT が Mint されるときのカウンターをインクリメントします。
    _tokenIds += 1;
  }

  // ユーザーは mintCharacterNFT 関数を呼び出して、NFT を Mint ことができます。
  // _characterIndex は フロントエンドから送信されます。
  function mintCharacterNFT(uint _characterIndex) external {
    // 現在の tokenId を取得します（constructor内でインクリメントしているため、1から始まります）。
    uint256 newItemId = _tokenIds;

    // msg.sender でフロントエンドからユーザーのアドレスを取得して、NFT をユーザーに Mint します。
    _safeMint(msg.sender, newItemId);

    // mapping で定義した tokenId を CharacterAttributesに紐付けます。
    nftHolderAttributes[newItemId] = CharacterAttributes({
      characterIndex: _characterIndex,
      name: defaultCharacters[_characterIndex].name,
      imageURI: defaultCharacters[_characterIndex].imageURI,
      hp: defaultCharacters[_characterIndex].hp,
      maxHp: defaultCharacters[_characterIndex].maxHp,
      attackDamage: defaultCharacters[_characterIndex].attackDamage
    });

    console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);

    // NFTの所有者を簡単に確認できるようにします。
    nftHolders[msg.sender] = newItemId;

    // 次に使用する人のためにtokenIdをインクリメントします。
    _tokenIds += 1;
  }

  // nftHolderAttributes を更新して、tokenURI を添付する関数を作成
  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];
    // charAttributes のデータ編集して、JSON の構造に合わせた変数に格納しています。
    string memory strHp = Strings.toString(charAttributes.hp);
    string memory strMaxHp = Strings.toString(charAttributes.maxHp);
    string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);

    string memory json = Base64.encode(
      // abi.encodePacked で文字列を結合します。
      // OpenSeaが採用するJSONデータをフォーマットしています。
      abi.encodePacked(
        '{"name": "',
        charAttributes.name,
        ' -- NFT #: ',
        Strings.toString(_tokenId),
        '", "description": "This is an NFT that lets people play in the game Metaverse Slayer!", "image": "',
        charAttributes.imageURI,
        '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
        strAttackDamage,'} ]}'
      )
    );
    // 文字列 data:application/json;base64, と json の中身を結合して、tokenURI を作成しています。
    string memory output = string(
    abi.encodePacked("data:application/json;base64,", json)
  );
  return output;
}
}
