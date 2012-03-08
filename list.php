<?php
$dir = "./frm";
$frms = scandir("./frm");
$result = array();

foreach ($frms as $filename) {
  if (strtolower(substr($filename, -3, 3)) === "frm") {
    $prefix = substr($filename, 0, -6);
    $postfix = substr($filename, -6, 2);
    $result[$prefix][$postfix] = $dir."/".$filename;
  }
}

echo "var frmlist = ".json_encode($result);
?>
