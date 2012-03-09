<?php
$dir = "./frm";
$frms = scandir("./frm");
$result = array();

foreach ($frms as $filename) {
  if (strtolower(substr($filename, -3, 3)) === "frm") {
    $prefix = substr($filename, -12, 2);
    $appearance = substr($filename, -10, 4);
    $postfix = substr($filename, -6, 2);
    $result[$prefix][$appearance][$postfix] = $dir."/".$filename;
  }
}

echo "var frmlist = ".json_encode($result);
?>
