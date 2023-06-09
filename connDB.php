<?php
$linkdb=mysqli_connect('xxx', 'xxx', 'xxx', 'xxx', 000);
if (!$linkdb) {
    header("Content-Type: text/html; charset=utf-8");
    echo "Невозможно подключиться к базе данных.";
    exit;
}
mysqli_query($linkdb,"SET NAMES UTF8");
?>