export async function getTokenAccountsByOwnerAndPrint(
  ownerAddr: string,
  mintAddr: string
) {
  try {
    const resp = await rpc
      .getTokenAccountsByOwner(address(ownerAddr), { mint: address(mintAddr) })
      .send();
    console.log(
      "getTokenAccountsByOwner resp:",
      JSON.stringify(resp.value, null, 2)
    );
  } catch (err) {
    console.log("getTokenAccountsByOwner error", err);
  }
}
